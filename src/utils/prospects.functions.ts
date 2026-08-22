import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ProspectSignal } from "@/lib/prospecting/industries";

async function assertAdmin(context: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
  userId: string;
}) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export interface ProspectVariant {
  key: "A" | "B";
  subject: string;
  opening: string;
  rationale: string;
}

export interface Prospect {
  id: string;
  business_name: string;
  industry: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  contact_email: string | null;
  has_website: boolean;
  pain_score: number;
  signals: ProspectSignal[];
  scanned_at: string | null;
  report_token: string;
  report_viewed_at: string | null;
  draft_subject: string | null;
  draft_body: string | null;
  draft_rationale: string | null;
  draft_status: string;
  contacted_at: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  variants: ProspectVariant[];
  sent_variant: string | null;
  lead_id: string | null;
  replied_at: string | null;
  booked_at: string | null;
  won_at: string | null;
}

const SELECT =
  "id, business_name, industry, category, address, phone, website, contact_email, has_website, pain_score, signals, scanned_at, report_token, report_viewed_at, draft_subject, draft_body, draft_rationale, draft_status, contacted_at, status, notes, created_at, variants, sent_variant, lead_id, replied_at, booked_at, won_at";


export const adminListProspects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ prospects: Prospect[] }> => {
    await assertAdmin(context as never);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (context as any).supabase;
    const { data, error } = await db
      .from("prospects")
      .select(SELECT)
      .order("pain_score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return { prospects: (data as Prospect[]) ?? [] };
  });

export const adminFindProspects = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ industry: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { runProspectScan } = await import("@/lib/prospecting/prospects.server");
    return runProspectScan(data.industry);
  });

export const adminScanPending = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { scanPendingProspects } = await import("@/lib/prospecting/prospects.server");
    const scanned = await scanPendingProspects();
    return { scanned };
  });

export const adminDraftOutreach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (context as any).supabase;
    const { data: prospect, error } = await db.from("prospects").select(SELECT).eq("id", data.id).maybeSingle();
    if (error || !prospect) throw new Error("Prospect not found");

    const { generateOutreachDraft } = await import("@/lib/prospecting/outreach.server");
    try {
      const draft = await generateOutreachDraft(prospect as Prospect);
      await db
        .from("prospects")
        .update({
          draft_subject: draft.subject,
          draft_body: draft.body,
          draft_rationale: draft.rationale,
          draft_status: "draft",
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);
      return { ok: true as const, ...draft };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Draft failed";
      await db.from("prospects").update({ draft_status: "failed", notes: message }).eq("id", data.id);
      throw new Error(message);
    }
  });

export const adminSaveProspectDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        subject: z.string().min(1).max(200),
        body: z.string().min(1).max(6000),
        contactEmail: z.string().email().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (context as any).supabase;
    const patch: Record<string, unknown> = {
      draft_subject: data.subject,
      draft_body: data.body,
      draft_status: "draft",
      updated_at: new Date().toISOString(),
    };
    if (data.contactEmail !== undefined) patch["contact_email"] = data.contactEmail;
    const { error } = await db.from("prospects").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const adminSendOutreach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (context as any).supabase;
    const { data: prospect } = await db.from("prospects").select(SELECT).eq("id", data.id).maybeSingle();
    if (!prospect) throw new Error("Prospect not found");
    const p = prospect as Prospect;
    if (!p.contact_email) throw new Error("No email address on file for this prospect");
    if (!p.draft_subject || !p.draft_body) throw new Error("Write or generate the email first");

    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const { SITE_URL } = await import("@/lib/prospecting/outreach.server");

    try {
      const result = await sendTemplateEmail("prospect-outreach", p.contact_email, {
        templateData: {
          businessName: p.business_name,
          subject: p.draft_subject,
          body: p.draft_body,
          reportUrl: `${SITE_URL}/site-report/${p.report_token}`,
          topIssue: p.signals?.[0]?.label ?? null,
        },
        idempotencyKey: `prospect-outreach-${p.id}`,
      });
      if (!result.sent) {
        await db
          .from("prospects")
          .update({ draft_status: "failed", notes: `Not delivered: ${result.reason}` })
          .eq("id", p.id);
        return { ok: false as const, reason: result.reason };
      }
      await db
        .from("prospects")
        .update({
          draft_status: "sent",
          status: "contacted",
          sent_variant: p.sent_variant ?? (p.variants?.length ? p.variants[0]!.key : null),
          contacted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", p.id);

      // Mirror the prospect into the CRM pipeline so replies and calls can advance it.
      const { ensureLeadForProspect } = await import("@/lib/prospecting/crm.server");
      await ensureLeadForProspect(p);

      return { ok: true as const };

    } catch (err) {
      const message = err instanceof Error ? err.message : "Send failed";
      await db.from("prospects").update({ draft_status: "failed", notes: message }).eq("id", p.id);
      throw new Error(message);
    }
  });

export const adminUpdateProspect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["new", "queued", "contacted", "replied", "won", "lost", "skipped"]).optional(),
        notes: z.string().max(2000).nullable().optional(),
        contactEmail: z.string().email().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (context as any).supabase;
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.status) patch["status"] = data.status;
    if (data.notes !== undefined) patch["notes"] = data.notes;
    if (data.contactEmail !== undefined) patch["contact_email"] = data.contactEmail;
    const { error } = await db.from("prospects").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
