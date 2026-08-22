import { streamText } from "ai";
import {
  AiGatewayBlockedError,
  createLovableAiGatewayProvider,
  statusFromAiError,
} from "@/lib/ai-gateway.server";
import { FOLLOWUP_PLAYBOOKS, SITE_URL, type PlaybookKey } from "./playbooks";

export const JOB_KEY = "followup_autopilot";
/** Hard cap on drafts generated per run. */
export const BATCH_SIZE = 6;
const LEASE_MINUTES = 5;
const MODEL = "google/gemini-3-flash-preview";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabaseAdmin as any;
}

export interface Candidate {
  playbook: PlaybookKey;
  triggerKey: string;
  leadId: string | null;
  sourceTable: string;
  sourceId: string;
  recipientName: string;
  recipientEmail: string;
  context: Record<string, unknown>;
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

/** Finds work across every playbook, newest signals first, bounded by BATCH_SIZE. */
export async function findCandidates(limit = BATCH_SIZE): Promise<Candidate[]> {
  const db = await admin();
  const out: Candidate[] = [];

  const { data: leads } = await db
    .from("voice_leads")
    .select("*")
    .eq("stage", "new")
    .eq("consent_to_follow_up", true)
    .not("email", "is", null)
    .lt("created_at", hoursAgo(2))
    .order("created_at", { ascending: false })
    .limit(limit);
  for (const l of leads ?? []) {
    out.push({
      playbook: "new_lead_no_contact",
      triggerKey: `new_lead_no_contact:${l.id}`,
      leadId: l.id,
      sourceTable: "voice_leads",
      sourceId: l.id,
      recipientName: l.full_name,
      recipientEmail: l.email as string,
      context: {
        company: l.company_name,
        projectType: l.project_type,
        primaryGoal: l.primary_goal,
        timeline: l.timeline,
        budgetRange: l.budget_range,
        website: l.website_url,
        notes: l.notes,
      },
    });
  }

  const { data: inquiries } = await db
    .from("contact_inquiries")
    .select("*")
    .eq("status", "unread")
    .lt("created_at", hoursAgo(6))
    .order("created_at", { ascending: false })
    .limit(limit);
  for (const i of inquiries ?? []) {
    out.push({
      playbook: "inquiry_unanswered",
      triggerKey: `inquiry_unanswered:${i.id}`,
      leadId: null,
      sourceTable: "contact_inquiries",
      sourceId: i.id,
      recipientName: i.name,
      recipientEmail: i.email,
      context: { projectType: i.project_type, message: i.message },
    });
  }

  const { data: audits } = await db
    .from("voice_audit_requests")
    .select("*")
    .eq("status", "audit_in_progress")
    .eq("consent_to_email", true)
    .lt("created_at", hoursAgo(12))
    .order("created_at", { ascending: false })
    .limit(limit);
  for (const a of audits ?? []) {
    out.push({
      playbook: "audit_pending",
      triggerKey: `audit_pending:${a.id}`,
      leadId: a.lead_id,
      sourceTable: "voice_audit_requests",
      sourceId: a.id,
      recipientName: a.full_name,
      recipientEmail: a.email,
      context: { website: a.website_url, bottleneck: a.primary_bottleneck },
    });
  }

  const { data: noShows } = await db
    .from("voice_bookings")
    .select("*")
    .eq("status", "no_show")
    .order("slot_start", { ascending: false })
    .limit(limit);
  for (const b of noShows ?? []) {
    out.push({
      playbook: "booking_no_show",
      triggerKey: `booking_no_show:${b.id}`,
      leadId: b.lead_id,
      sourceTable: "voice_bookings",
      sourceId: b.id,
      recipientName: b.full_name,
      recipientEmail: b.email,
      context: { missedSlot: b.slot_start, timeZone: b.time_zone },
    });
  }

  const { data: completed } = await db
    .from("voice_bookings")
    .select("*")
    .eq("status", "completed")
    .lt("slot_end", hoursAgo(24))
    .order("slot_end", { ascending: false })
    .limit(limit);
  for (const b of completed ?? []) {
    out.push({
      playbook: "post_call_no_proposal",
      triggerKey: `post_call_no_proposal:${b.id}`,
      leadId: b.lead_id,
      sourceTable: "voice_bookings",
      sourceId: b.id,
      recipientName: b.full_name,
      recipientEmail: b.email,
      context: { callDate: b.slot_start, timeZone: b.time_zone },
    });
  }

  const { data: unpaid } = await db
    .from("orders")
    .select("*")
    .neq("payment_status", "paid")
    .not("customer_email", "is", null)
    .lt("created_at", hoursAgo(4))
    .order("created_at", { ascending: false })
    .limit(limit);
  for (const o of unpaid ?? []) {
    out.push({
      playbook: "abandoned_deposit",
      triggerKey: `abandoned_deposit:${o.id}`,
      leadId: null,
      sourceTable: "orders",
      sourceId: o.id,
      recipientName: o.customer_name || "there",
      recipientEmail: o.customer_email as string,
      context: { tier: o.tier_label || o.product_name, amountCents: o.amount_total },
    });
  }

  // Drop anything already drafted / sent / dismissed — idempotency by trigger_key.
  if (out.length === 0) return [];
  const { data: existing } = await db
    .from("followup_drafts")
    .select("trigger_key")
    .in(
      "trigger_key",
      out.map((c) => c.triggerKey),
    );
  const seen = new Set((existing ?? []).map((r: { trigger_key: string }) => r.trigger_key));
  return out.filter((c) => !seen.has(c.triggerKey)).slice(0, limit);
}

const SYSTEM = `You write follow-up emails for Rory Ulloa, creative director and no-code developer at The Roy Effect (theroyeffect.com), a Houston-based studio building brands and websites.

Voice: direct, warm, confident, zero fluff. Short paragraphs. No emoji, no exclamation marks, no "I hope this email finds you well", no corporate filler.
Rules: address the person by first name, reference the specific details you are given (never invent facts, prices, dates, or promises), keep the body under 130 words, end with one clear next step. Do not include a subject line, greeting sign-off block, or the CTA link inside the body — the CTA button is added separately. Sign-off is handled by the template.

Reply with ONLY a JSON object using exactly these keys: {"subject": string, "body": string, "rationale": string}. No markdown fence, no commentary.`;

export interface GeneratedDraft {
  subject: string;
  body: string;
  rationale: string;
  model: string;
}

const pick = (obj: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

/** Tolerant parse: models vary on key names, fences, and array wrappers. */
export function parseDraftResponse(raw: string): Omit<GeneratedDraft, "model"> {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.search(/[[{]/);
  if (start === -1) throw new Error("AI returned no JSON");
  let parsed: unknown = JSON.parse(cleaned.slice(start));
  if (Array.isArray(parsed)) parsed = parsed[0];
  if (!parsed || typeof parsed !== "object") throw new Error("AI returned no draft object");
  const obj = parsed as Record<string, unknown>;
  const subject = pick(obj, ["subject", "subjectLine", "subject_line", "title", "heading"]);
  const body = pick(obj, ["body", "emailBody", "email_body", "message", "content"]);
  const rationale = pick(obj, ["rationale", "reason", "why", "reasoning"]);
  if (!subject || !body) throw new Error("AI draft missing subject or body");
  return {
    subject: subject.slice(0, 140),
    body: body.slice(0, 4000),
    rationale: rationale.slice(0, 500),
  };
}

/** Calls the AI gateway to draft one follow-up. Throws AiGatewayBlockedError on 402/403. */
export async function generateDraft(candidate: Candidate): Promise<GeneratedDraft> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
  const play = FOLLOWUP_PLAYBOOKS[candidate.playbook];
  const gateway = createLovableAiGatewayProvider(apiKey);

  try {
    const result = streamText({
      model: gateway(MODEL),
      system: SYSTEM,
      prompt: [
        `Situation: ${play.label}.`,
        `Objective: ${play.goal}`,
        `Recipient name: ${candidate.recipientName}`,
        `Known details (JSON, may contain nulls — ignore nulls):`,
        JSON.stringify(candidate.context),
        `Write the subject line (under 60 characters, no colon-heavy clickbait), the email body, and a one-sentence rationale explaining to Rory why this send makes sense now.`,
      ].join("\n"),
    });
    const text = await result.text;
    return { ...parseDraftResponse(text), model: MODEL };
  } catch (error) {
    const status = statusFromAiError(error);
    if (status === 402 || status === 403) {
      throw new AiGatewayBlockedError(
        status,
        status === 402
          ? "AI credits exhausted — top up credits in Lovable to resume drafting."
          : "AI access is blocked by workspace policy.",
      );
    }
    throw error;
  }
}

export interface RunResult {
  ok: boolean;
  status: "completed" | "paused" | "skipped_locked" | "skipped_paused" | "failed";
  drafted: number;
  message?: string;
}

/** Runs one bounded batch: single-flight lease, idempotent inserts, circuit breaker. */
export async function runFollowupBatch(runner: string): Promise<RunResult> {
  const db = await admin();

  const { data: job } = await db
    .from("automation_jobs")
    .select("*")
    .eq("job_key", JOB_KEY)
    .maybeSingle();
  if (!job) return { ok: false, status: "failed", drafted: 0, message: "Job row missing" };

  const paused = job.status === "paused";
  // Paused on credit/policy blocks: allow a single probe item per run to detect recovery.
  const limit = paused ? 1 : BATCH_SIZE;

  const now = new Date();
  const leaseHeld =
    job.lease_expires_at !== null && new Date(job.lease_expires_at).getTime() > now.getTime();
  if (leaseHeld) return { ok: true, status: "skipped_locked", drafted: 0 };

  const leaseExpiry = new Date(now.getTime() + LEASE_MINUTES * 60_000).toISOString();
  const { data: leased } = await db
    .from("automation_jobs")
    .update({ lease_owner: runner, lease_expires_at: leaseExpiry, updated_at: now.toISOString() })
    .eq("job_key", JOB_KEY)
    .or(`lease_expires_at.is.null,lease_expires_at.lt.${now.toISOString()}`)
    .select("job_key")
    .maybeSingle();
  if (!leased) return { ok: true, status: "skipped_locked", drafted: 0 };

  let drafted = 0;
  let result: RunResult = { ok: true, status: "completed", drafted: 0 };

  try {
    const candidates = await findCandidates(limit);
    for (const candidate of candidates) {
      try {
        const draft = await generateDraft(candidate);
        const play = FOLLOWUP_PLAYBOOKS[candidate.playbook];
        // Unique trigger_key makes re-runs idempotent.
        const { error } = await db.from("followup_drafts").insert({
          trigger_key: candidate.triggerKey,
          playbook: candidate.playbook,
          lead_id: candidate.leadId,
          source_table: candidate.sourceTable,
          source_id: candidate.sourceId,
          recipient_name: candidate.recipientName,
          recipient_email: candidate.recipientEmail,
          subject: draft.subject,
          body: draft.body,
          cta_label: play.ctaLabel,
          cta_url: `${SITE_URL}${play.ctaPath}`,
          rationale: draft.rationale,
          model: draft.model,
          status: "draft",
        });
        if (!error) drafted += 1;
      } catch (error) {
        if (error instanceof AiGatewayBlockedError) throw error;
        // One bad item must not kill the batch.
        console.error("[autopilot] draft failed", candidate.triggerKey, error);
      }
    }

    if (paused && drafted > 0) {
      await db
        .from("automation_jobs")
        .update({ status: "active", paused_reason: null })
        .eq("job_key", JOB_KEY);
    }
    result = { ok: true, status: paused && drafted === 0 ? "skipped_paused" : "completed", drafted };
  } catch (error) {
    if (error instanceof AiGatewayBlockedError) {
      await db
        .from("automation_jobs")
        .update({ status: "paused", paused_reason: error.message, last_error: error.message })
        .eq("job_key", JOB_KEY);
      result = { ok: false, status: "paused", drafted, message: error.message };
    } else {
      const message = error instanceof Error ? error.message : String(error);
      await db
        .from("automation_jobs")
        .update({ last_error: message, consecutive_failures: (job.consecutive_failures ?? 0) + 1 })
        .eq("job_key", JOB_KEY);
      result = { ok: false, status: "failed", drafted, message };
    }
  } finally {
    await db
      .from("automation_jobs")
      .update({
        lease_owner: null,
        lease_expires_at: null,
        last_run_at: new Date().toISOString(),
        items_processed: (job.items_processed ?? 0) + drafted,
        ...(result.ok ? { consecutive_failures: 0, last_error: null } : {}),
      })
      .eq("job_key", JOB_KEY);
  }

  return result;
}
