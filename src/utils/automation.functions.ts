import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/utils/require-admin";

export interface FollowupDraft {
  id: string;
  playbook: string;
  lead_id: string | null;
  source_table: string;
  recipient_name: string;
  recipient_email: string;
  subject: string;
  body: string;
  cta_label: string | null;
  cta_url: string | null;
  rationale: string | null;
  status: string;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface AutomationJob {
  job_key: string;
  status: string;
  paused_reason: string | null;
  last_run_at: string | null;
  last_error: string | null;
  items_processed: number;
}

export interface AutopilotState {
  job: AutomationJob | null;
  drafts: FollowupDraft[];
}

export const adminGetAutopilot = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AutopilotState> => {
    await assertAdmin(context as never);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (context as any).supabase;
    const [{ data: job }, { data: drafts }] = await Promise.all([
      db.from("automation_jobs").select("*").eq("job_key", "followup_autopilot").maybeSingle(),
      db.from("followup_drafts").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    return { job: (job as AutomationJob) ?? null, drafts: (drafts as FollowupDraft[]) ?? [] };
  });

export const adminRunAutopilot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { runFollowupBatch } = await import("@/lib/automation/followups.server");
    return runFollowupBatch("admin");
  });

export const adminSetAutopilotStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ paused: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (context as any).supabase;
    await db
      .from("automation_jobs")
      .update({
        status: data.paused ? "paused" : "active",
        paused_reason: data.paused ? "Paused by admin" : null,
      })
      .eq("job_key", "followup_autopilot");
    return { ok: true };
  });

const editSchema = z.object({
  id: z.string().uuid(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(6000),
});

export const adminUpdateDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => editSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (context as any).supabase;
    const { error } = await db
      .from("followup_drafts")
      .update({ subject: data.subject, body: data.body })
      .eq("id", data.id)
      .eq("status", "draft");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDismissDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (context as any).supabase;
    await db
      .from("followup_drafts")
      .update({ status: "dismissed" })
      .eq("id", data.id)
      .eq("status", "draft");
    return { ok: true };
  });

/** One-click approve: sends the drafted email and records the outcome. */
export const adminApproveDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (context as any).supabase;
    const { data: draft } = await db
      .from("followup_drafts")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!draft) throw new Error("Draft not found");
    if (draft.status !== "draft") throw new Error("Draft already handled");

    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    try {
      const result = await sendTemplateEmail("voice-agent-followup", draft.recipient_email, {
        idempotencyKey: `followup-draft-${draft.id}`,
        replyTo: "rory@theroyeffect.com",
        templateData: {
          heading: draft.subject,
          body: draft.body,
          ctaLabel: draft.cta_label,
          ctaUrl: draft.cta_url,
        },
      });
      if (!result.sent) {
        await db
          .from("followup_drafts")
          .update({ status: "failed", error_message: "Recipient is suppressed" })
          .eq("id", draft.id);
        return { ok: false, message: "Recipient is unsubscribed or suppressed" };
      }
      await db
        .from("followup_drafts")
        .update({ status: "sent", sent_at: new Date().toISOString(), error_message: null })
        .eq("id", draft.id);
      // Advance the lead so it is not re-drafted for the same reason.
      if (draft.lead_id) {
        await db
          .from("voice_leads")
          .update({ stage: "contacted" })
          .eq("id", draft.lead_id)
          .eq("stage", "new");
      }
      if (draft.source_table === "contact_inquiries") {
        await db.from("contact_inquiries").update({ status: "read" }).eq("id", draft.source_id);
      }
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await db
        .from("followup_drafts")
        .update({ status: "failed", error_message: message })
        .eq("id", draft.id);
      throw new Error(message);
    }
  });

export const adminRetryDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (context as any).supabase;
    await db
      .from("followup_drafts")
      .update({ status: "draft", error_message: null })
      .eq("id", data.id)
      .eq("status", "failed");
    return { ok: true };
  });
