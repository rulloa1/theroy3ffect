import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

export const LEAD_STAGES = [
  "new",
  "contacted",
  "discovery_scheduled",
  "proposal_sent",
  "won",
  "lost",
] as const;

export type LeadStage = (typeof LEAD_STAGES)[number];

export interface CrmBooking {
  id: string;
  slot_start: string;
  slot_end: string;
  time_zone: string;
  status: string;
  full_name: string;
  email: string;
  phone: string | null;
}

export interface CrmAudit {
  id: string;
  website_url: string;
  primary_bottleneck: string | null;
  status: string;
  created_at: string;
}

export interface CrmFollowup {
  id: string;
  reason: string;
  urgency: string;
  summary: string;
  status: string;
  created_at: string;
}

export interface CrmLead {
  id: string;
  full_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  website_url: string | null;
  project_type: string;
  primary_goal: string | null;
  target_audience?: string | null;
  timeline: string | null;
  budget_range: string | null;
  notes: string | null;
  consent_to_follow_up: boolean;
  stage: string;
  source: string;
  vapi_call_id?: string | null;
  created_at: string;
  updated_at: string;
  bookings: CrmBooking[];
  audits: CrmAudit[];
  followups: CrmFollowup[];
}

export interface CrmCallRecord {
  id: string;
  vapi_call_id: string;
  status: string;
  transcript: string | null;
  summary: string | null;
  recording_url: string | null;
  ended_reason: string | null;
  messages: unknown;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface CrmToolLog {
  id: string;
  vapi_call_id: string | null;
  tool_name: string;
  request_payload: unknown;
  result_payload: unknown;
  ok: boolean;
  error_message: string | null;
  created_at: string;
}

export interface CrmLeadDetail {
  lead: CrmLead | null;
  bookings: (CrmBooking & { created_at?: string; vapi_call_id?: string | null })[];
  calls: CrmCallRecord[];
  logs: CrmToolLog[];
}

export const adminGetLeadDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { leadId: string }) => data)
  .handler(async ({ data, context }): Promise<CrmLeadDetail> => {
    await assertAdmin(context as never);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = context.supabase as any;

    const { data: lead } = await db
      .from("voice_leads")
      .select("*")
      .eq("id", data.leadId)
      .maybeSingle();
    if (!lead) return { lead: null, bookings: [], calls: [], logs: [] };

    const bookingQuery = db
      .from("voice_bookings")
      .select("*")
      .order("slot_start", { ascending: false });

    const [bookingsByLead, bookingsByEmail, auditsRes, followupsRes] = await Promise.all([
      bookingQuery.eq("lead_id", lead.id),
      lead.email
        ? db
            .from("voice_bookings")
            .select("*")
            .ilike("email", lead.email)
            .order("slot_start", { ascending: false })
        : Promise.resolve({ data: [] }),
      db.from("voice_audit_requests").select("*").eq("lead_id", lead.id),
      db.from("voice_followups").select("*").eq("lead_id", lead.id),
    ]);

    const bookingMap = new Map<string, any>();
    for (const row of [...(bookingsByLead.data ?? []), ...(bookingsByEmail.data ?? [])]) {
      bookingMap.set(row.id, row);
    }
    const bookings = [...bookingMap.values()].sort(
      (a, b) => +new Date(b.slot_start) - +new Date(a.slot_start),
    );

    const callIds = [
      ...new Set(
        [
          lead.vapi_call_id,
          ...bookings.map((b) => b.vapi_call_id),
          ...(auditsRes.data ?? []).map((a: any) => a.vapi_call_id),
          ...(followupsRes.data ?? []).map((f: any) => f.vapi_call_id),
        ].filter(Boolean) as string[],
      ),
    ];

    let calls: CrmCallRecord[] = [];
    let logs: CrmToolLog[] = [];
    if (callIds.length > 0) {
      const [callsRes, logsRes] = await Promise.all([
        db
          .from("voice_call_records")
          .select("*")
          .in("vapi_call_id", callIds)
          .order("created_at", { ascending: false }),
        db
          .from("voice_agent_logs")
          .select("*")
          .in("vapi_call_id", callIds)
          .order("created_at", { ascending: true }),
      ]);
      calls = (callsRes.data ?? []) as CrmCallRecord[];
      logs = (logsRes.data ?? []) as CrmToolLog[];
    }

    return {
      lead: { ...lead, bookings, audits: auditsRes.data ?? [], followups: followupsRes.data ?? [] },
      bookings,
      calls,
      logs,
    };
  });


export const adminListPipeline = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ leads: CrmLead[] }> => {
    await assertAdmin(context as never);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = context.supabase as any;

    const [leadsRes, bookingsRes, auditsRes, followupsRes] = await Promise.all([
      db.from("voice_leads").select("*").order("created_at", { ascending: false }).limit(200),
      db.from("voice_bookings").select("*").order("slot_start", { ascending: true }).limit(300),
      db
        .from("voice_audit_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300),
      db.from("voice_followups").select("*").order("created_at", { ascending: false }).limit(300),
    ]);

    const leads = (leadsRes.data ?? []) as CrmLead[];
    const byId = new Map<string, CrmLead>();
    const byEmail = new Map<string, CrmLead>();

    for (const lead of leads) {
      lead.bookings = [];
      lead.audits = [];
      lead.followups = [];
      byId.set(lead.id, lead);
      if (lead.email) byEmail.set(lead.email.toLowerCase(), lead);
    }

    const attach = <T extends { lead_id?: string | null; email?: string | null }>(
      rows: T[],
      key: "bookings" | "audits" | "followups",
    ) => {
      for (const row of rows) {
        const lead =
          (row.lead_id ? byId.get(row.lead_id) : undefined) ??
          (row.email ? byEmail.get(row.email.toLowerCase()) : undefined);
        if (lead) (lead[key] as unknown[]).push(row);
      }
    };

    attach((bookingsRes.data ?? []) as never[], "bookings");
    attach((auditsRes.data ?? []) as never[], "audits");
    attach((followupsRes.data ?? []) as never[], "followups");

    return { leads };
  });

export const adminUpdateLeadStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { leadId: string; stage: string; notes?: string }) => data)
  .handler(async ({ data, context }): Promise<{ success: boolean; error?: string }> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin.from as any)("voice_leads")
      .update({
        stage: data.stage,
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      })
      .eq("id", data.leadId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  });

export const adminUpdateBookingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bookingId: string; status: string }) => data)
  .handler(async ({ data, context }): Promise<{ success: boolean; error?: string }> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin.from as any)("voice_bookings")
      .update({ status: data.status })
      .eq("id", data.bookingId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  });

export const adminResolveFollowup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { followupId: string; status: string }) => data)
  .handler(async ({ data, context }): Promise<{ success: boolean; error?: string }> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin.from as any)("voice_followups")
      .update({ status: data.status })
      .eq("id", data.followupId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  });
