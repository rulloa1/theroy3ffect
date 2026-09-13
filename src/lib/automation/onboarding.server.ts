/**
 * Purchase → project setup agent.
 *
 * Every paid discovery call, commission and retainer enqueues one
 * `onboarding_runs` row. The agent then:
 *   1. writes a kickoff plan with AI (falling back to the playbook template),
 *   2. creates or reuses the client's portal project and its milestones,
 *   3. auto-sends the welcome + next-step email (the only email that goes out
 *      without Rory's approval),
 *   4. leaves the run in the admin dashboard for review.
 *
 * Keyed on (source_table, source_id) so Stripe webhook retries are idempotent.
 */
import { streamText } from "ai";
import {
  AiGatewayBlockedError,
  resolveDraftingProvider,
  statusFromAiError,
} from "@/lib/ai-gateway.server";
import { escapeLikePattern } from "@/lib/sql-like";
import { SITE_URL } from "./playbooks";
import { ONBOARDING_PLAYBOOKS, type OnboardingTrigger } from "./onboarding-playbooks";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabaseAdmin as any;
}

export interface OnboardingInput {
  triggerType: OnboardingTrigger;
  sourceTable: string;
  sourceId: string;
  clientEmail: string;
  clientName?: string | null;
  productName?: string | null;
  amountCents?: number;
  currency?: string;
  context?: Record<string, unknown>;
}

export interface PlannedMilestone {
  title: string;
  note: string;
  dueInDays: number;
}

export interface KickoffPlan {
  projectTitle: string;
  summary: string;
  nextStep: string;
  kickoffNotes: string;
  milestones: PlannedMilestone[];
}

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency || "usd").toUpperCase(),
  }).format((cents ?? 0) / 100);

const SYSTEM = `You plan client onboarding for Rory Ulloa, creative director and no-code developer at The Roy Effect (theroyeffect.com), a Houston studio building brands and websites.

You are given what the client just paid for. Produce a short, concrete kickoff plan for the client portal.
Rules: never invent prices, dates, names or promises beyond what you are given. Plain, direct language. No emoji. Milestone titles under 6 words. Milestone notes one short sentence. Between 3 and 6 milestones, in delivery order. "nextStep" is the single thing the client should do next.

Reply with ONLY a JSON object using exactly these keys:
{"projectTitle": string, "summary": string, "nextStep": string, "kickoffNotes": string, "milestones": [{"title": string, "note": string, "dueInDays": number}]}
No markdown fence, no commentary.`;

function fallbackPlan(input: OnboardingInput): KickoffPlan {
  const play = ONBOARDING_PLAYBOOKS[input.triggerType] ?? ONBOARDING_PLAYBOOKS["commission"]!;
  const name = (input.clientName || input.clientEmail.split("@")[0] || "Client").trim();
  const product = input.productName || "Project";
  return {
    projectTitle: play.projectTitle(name, product),
    summary: `${product} — set up automatically from the payment on ${new Date().toLocaleDateString("en-US")}.`,
    nextStep: play.milestones[0]?.note ?? "Send over your brief.",
    kickoffNotes: play.goal,
    milestones: play.milestones.map((m) => ({ ...m })),
  };
}

function parsePlan(raw: string): KickoffPlan {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.search(/[[{]/);
  if (start === -1) throw new Error("AI returned no JSON");
  let parsed: unknown = JSON.parse(cleaned.slice(start));
  if (Array.isArray(parsed)) parsed = parsed[0];
  if (!parsed || typeof parsed !== "object") throw new Error("AI returned no plan object");
  const obj = parsed as Record<string, unknown>;
  const str = (value: unknown, max: number) =>
    typeof value === "string" ? value.trim().slice(0, max) : "";
  const rawMilestones = Array.isArray(obj["milestones"]) ? (obj["milestones"] as unknown[]) : [];
  const milestones: PlannedMilestone[] = rawMilestones
    .slice(0, 6)
    .map((entry) => {
      const m = (entry ?? {}) as Record<string, unknown>;
      const due = Number(m["dueInDays"]);
      return {
        title: str(m["title"], 80),
        note: str(m["note"], 240),
        dueInDays: Number.isFinite(due) && due >= 0 && due <= 365 ? Math.round(due) : 7,
      };
    })
    .filter((m) => m.title);
  if (milestones.length < 2) throw new Error("AI plan had too few milestones");
  return {
    projectTitle: str(obj["projectTitle"], 120) || "Client project",
    summary: str(obj["summary"], 400),
    nextStep: str(obj["nextStep"], 240),
    kickoffNotes: str(obj["kickoffNotes"], 1200),
    milestones,
  };
}

/** Drafts the kickoff plan. Falls back to the playbook template on any AI failure. */
export async function generateKickoffPlan(
  input: OnboardingInput,
): Promise<{ plan: KickoffPlan; model: string; rationale: string; aiError?: string }> {
  const play = ONBOARDING_PLAYBOOKS[input.triggerType] ?? ONBOARDING_PLAYBOOKS["commission"]!;
  let model = "template";
  try {
    const resolved = resolveDraftingProvider();
    model = resolved.model;
    const result = streamText({
      model: resolved.provider(resolved.model),
      system: SYSTEM,
      prompt: [
        `Purchase type: ${play.label}.`,
        `Objective: ${play.goal}`,
        `Client name: ${input.clientName || "(unknown)"}`,
        `Product purchased: ${input.productName || "(unnamed)"}`,
        `Amount paid: ${money(input.amountCents ?? 0, input.currency ?? "usd")}`,
        `Extra context (JSON, ignore nulls): ${JSON.stringify(input.context ?? {})}`,
        `Standard milestones for this purchase type (adapt, don't copy blindly): ${JSON.stringify(play.milestones)}`,
        `"kickoffNotes" is written for Rory, not the client: what to prepare before the first touchpoint.`,
      ].join("\n"),
    });
    const plan = parsePlan(await result.text);
    return { plan, model, rationale: plan.kickoffNotes };
  } catch (error) {
    const status = statusFromAiError(error);
    const message =
      error instanceof AiGatewayBlockedError
        ? error.message
        : status === 402
          ? "AI credits exhausted — plan fell back to the standard template."
          : error instanceof Error
            ? error.message
            : String(error);
    const plan = fallbackPlan(input);
    return { plan, model: "template", rationale: plan.kickoffNotes, aiError: message };
  }
}

const dueDate = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

/** Creates (or reuses) the portal project and syncs the planned milestones. */
async function applyPlan(input: OnboardingInput, plan: KickoffPlan): Promise<string> {
  const db = await admin();
  const email = input.clientEmail.toLowerCase();

  const { data: existing } = await db
    .from("client_projects")
    .select("id")
    .ilike("client_email", escapeLikePattern(email))
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let projectId = existing?.id as string | undefined;

  if (projectId) {
    await db
      .from("client_projects")
      .update({ next_step: plan.nextStep || null, updated_at: new Date().toISOString() })
      .eq("id", projectId);
  } else {
    const { data: created, error } = await db
      .from("client_projects")
      .insert({
        client_email: email,
        title: plan.projectTitle,
        summary: plan.summary || null,
        status: "onboarding",
        start_date: new Date().toISOString().slice(0, 10),
        next_step: plan.nextStep || null,
      })
      .select("id")
      .single();
    if (error) throw new Error(`Project creation failed: ${error.message}`);
    projectId = created.id as string;
  }

  const { data: current } = await db
    .from("client_milestones")
    .select("id, title, position")
    .eq("project_id", projectId);
  const seen = new Map<string, { id: string; position: number }>(
    ((current ?? []) as { id: string; title: string; position: number }[]).map((m) => [
      m.title.trim().toLowerCase(),
      { id: m.id, position: m.position },
    ]),
  );
  let position = ((current ?? []) as { position: number }[]).reduce(
    (max, m) => Math.max(max, m.position ?? 0),
    -1,
  );

  for (const milestone of plan.milestones) {
    const key = milestone.title.trim().toLowerCase();
    if (seen.has(key)) continue;
    position += 1;
    await db.from("client_milestones").insert({
      project_id: projectId,
      title: milestone.title,
      note: milestone.note || null,
      status: "pending",
      position,
      due_date: dueDate(milestone.dueInDays),
    });
  }

  return projectId as string;
}

async function sendWelcome(input: OnboardingInput, plan: KickoffPlan, runId: string) {
  const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
  const result = await sendTemplateEmail("client-welcome", input.clientEmail, {
    idempotencyKey: `client-welcome-${runId}`,
    replyTo: "rory@theroyeffect.com",
    templateData: {
      clientName: (input.clientName || "").split(" ")[0] || "there",
      productName: input.productName || "your project",
      amountLabel: money(input.amountCents ?? 0, input.currency ?? "usd"),
      nextStep: plan.nextStep,
      milestones: plan.milestones.map((m) => m.title),
      portalUrl: `${SITE_URL}/portal`,
      briefUrl: `${SITE_URL}/brief`,
    },
  });
  return result.sent;
}

/** Records the purchase so the agent can set it up. Safe to call repeatedly. */
export async function enqueueOnboarding(input: OnboardingInput): Promise<string | null> {
  if (!input.clientEmail) return null;
  const db = await admin();
  const { data, error } = await db
    .from("onboarding_runs")
    .upsert(
      {
        trigger_type: input.triggerType,
        source_table: input.sourceTable,
        source_id: input.sourceId,
        client_email: input.clientEmail.toLowerCase(),
        client_name: input.clientName ?? null,
        product_name: input.productName ?? null,
        amount_cents: input.amountCents ?? 0,
        currency: input.currency ?? "usd",
        plan: { context: input.context ?? {} },
      },
      { onConflict: "source_table,source_id", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("[onboarding] enqueue failed:", error.message);
    return null;
  }
  return (data?.id as string) ?? null;
}

export interface OnboardingRunResult {
  ok: boolean;
  runId: string;
  status: "ready" | "failed" | "skipped";
  message?: string;
}

/** Runs the agent for one queued purchase. */
export async function processOnboardingRun(runId: string): Promise<OnboardingRunResult> {
  const db = await admin();
  const { data: run } = await db.from("onboarding_runs").select("*").eq("id", runId).maybeSingle();
  if (!run) return { ok: false, runId, status: "failed", message: "Run not found" };
  if (run.status === "ready" || run.status === "approved" || run.status === "dismissed") {
    return { ok: true, runId, status: "skipped" };
  }

  const input: OnboardingInput = {
    triggerType: run.trigger_type as OnboardingTrigger,
    sourceTable: run.source_table,
    sourceId: run.source_id,
    clientEmail: run.client_email,
    clientName: run.client_name,
    productName: run.product_name,
    amountCents: run.amount_cents ?? 0,
    currency: run.currency ?? "usd",
    context: (run.plan?.context ?? {}) as Record<string, unknown>,
  };

  try {
    const { plan, model, rationale, aiError } = await generateKickoffPlan(input);
    const projectId = await applyPlan(input, plan);

    let welcomeSentAt: string | null = run.welcome_email_sent_at ?? null;
    let emailError: string | null = null;
    if (!welcomeSentAt) {
      try {
        const sent = await sendWelcome(input, plan, runId);
        welcomeSentAt = sent ? new Date().toISOString() : null;
        if (!sent) emailError = "Welcome email skipped — recipient is unsubscribed.";
      } catch (error) {
        emailError = error instanceof Error ? error.message : String(error);
      }
    }

    await db
      .from("onboarding_runs")
      .update({
        status: "ready",
        project_id: projectId,
        plan: { ...plan, context: input.context ?? {} },
        rationale,
        model,
        welcome_email_sent_at: welcomeSentAt,
        error_message: aiError ?? emailError,
      })
      .eq("id", runId);

    return { ok: true, runId, status: "ready" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db
      .from("onboarding_runs")
      .update({ status: "failed", error_message: message })
      .eq("id", runId);
    console.error("[onboarding] run failed", runId, message);
    return { ok: false, runId, status: "failed", message };
  }
}

/** Enqueue + run in one step, never throwing into the caller (Stripe webhook). */
export async function startOnboarding(input: OnboardingInput): Promise<void> {
  try {
    const runId = await enqueueOnboarding(input);
    if (runId) await processOnboardingRun(runId);
  } catch (error) {
    console.error("[onboarding] start failed:", error);
  }
}

/** Processes every queued purchase that has not been set up yet. */
export async function processPendingOnboarding(limit = 10): Promise<{ processed: number }> {
  const db = await admin();
  const { data } = await db
    .from("onboarding_runs")
    .select("id")
    .in("status", ["pending", "failed"])
    .order("created_at", { ascending: true })
    .limit(limit);
  let processed = 0;
  for (const row of (data ?? []) as { id: string }[]) {
    const result = await processOnboardingRun(row.id);
    if (result.ok && result.status === "ready") processed += 1;
  }
  return { processed };
}
