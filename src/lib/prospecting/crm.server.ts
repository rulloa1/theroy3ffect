/** Bridges approved prospects into the voice_leads CRM pipeline. */

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabaseAdmin as any;
}

export interface ProspectLike {
  id: string;
  business_name: string;
  contact_email: string | null;
  phone: string | null;
  website: string | null;
  industry: string;
  pain_score: number;
  lead_id?: string | null;
  signals?: { label: string }[] | null;
}

/** Maps a prospect status onto the CRM lead stage. Never downgrades a won lead. */
export const STAGE_FOR_STATUS: Record<string, string> = {
  contacted: "contacted",
  replied: "contacted",
  meeting: "discovery_scheduled",
  won: "won",
  lost: "lost",
};

/** Creates (or reuses) the CRM lead for a prospect and links it back. */
export async function ensureLeadForProspect(prospect: ProspectLike): Promise<string | null> {
  if (prospect.lead_id) return prospect.lead_id;
  const db = await admin();
  const email = prospect.contact_email?.trim().toLowerCase() ?? null;

  if (email) {
    const { data: existing } = await db
      .from("voice_leads")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (existing?.id) {
      await db.from("prospects").update({ lead_id: existing.id }).eq("id", prospect.id);
      return existing.id as string;
    }
  }

  const topIssue = prospect.signals?.[0]?.label ?? null;
  const { data: created, error } = await db
    .from("voice_leads")
    .insert({
      full_name: prospect.business_name,
      company_name: prospect.business_name,
      email,
      phone: prospect.phone,
      website_url: prospect.website,
      project_type: "website",
      primary_goal: topIssue ? `Fix: ${topIssue}` : "Outbound prospect",
      notes: `Sourced by Prospect Finder · ${prospect.industry} · pain score ${prospect.pain_score}`,
      consent_to_follow_up: false,
      stage: "contacted",
      source: "prospecting",
    })
    .select("id")
    .maybeSingle();
  if (error || !created) return null;

  await db.from("prospects").update({ lead_id: created.id }).eq("id", prospect.id);
  return created.id as string;
}

/** Moves the linked CRM lead to the stage implied by the prospect status. */
export async function syncLeadStage(leadId: string | null, prospectStatus: string) {
  const stage = STAGE_FOR_STATUS[prospectStatus];
  if (!leadId || !stage) return;
  const db = await admin();
  const { data: lead } = await db.from("voice_leads").select("stage").eq("id", leadId).maybeSingle();
  if (lead?.stage === "won" && stage !== "won") return;
  await db.from("voice_leads").update({ stage, updated_at: new Date().toISOString() }).eq("id", leadId);
}

export interface CrmSyncResult {
  booked: number;
  won: number;
}

/**
 * Advances prospects automatically:
 * - a discovery booking on the linked lead (or matching email) → meeting
 * - a paid order under the same email → won
 */
export async function syncProspectCrm(): Promise<CrmSyncResult> {
  const db = await admin();
  const { data: rows } = await db
    .from("prospects")
    .select("id, lead_id, contact_email, status, booked_at, won_at")
    .not("contacted_at", "is", null)
    .limit(500);

  const prospects = (rows ?? []) as {
    id: string;
    lead_id: string | null;
    contact_email: string | null;
    status: string;
    booked_at: string | null;
    won_at: string | null;
  }[];
  if (prospects.length === 0) return { booked: 0, won: 0 };

  const emails = prospects.map((p) => p.contact_email?.toLowerCase()).filter(Boolean) as string[];
  const leadIds = prospects.map((p) => p.lead_id).filter(Boolean) as string[];

  const [bookingsRes, ordersRes] = await Promise.all([
    db
      .from("voice_bookings")
      .select("lead_id, email, slot_start, status")
      .or(
        [
          leadIds.length ? `lead_id.in.(${leadIds.join(",")})` : "",
          emails.length ? `email.in.(${emails.map((e) => `"${e}"`).join(",")})` : "",
        ]
          .filter(Boolean)
          .join(",") || "lead_id.is.null",
      )
      .limit(500),
    emails.length
      ? db
          .from("orders")
          .select("customer_email, amount_total, payment_status, created_at")
          .in("customer_email", emails)
          .limit(500)
      : Promise.resolve({ data: [] }),
  ]);

  const bookingByLead = new Map<string, string>();
  const bookingByEmail = new Map<string, string>();
  for (const b of (bookingsRes.data ?? []) as {
    lead_id: string | null;
    email: string | null;
    slot_start: string;
    status: string;
  }[]) {
    if (b.status === "cancelled") continue;
    if (b.lead_id) bookingByLead.set(b.lead_id, b.slot_start);
    if (b.email) bookingByEmail.set(b.email.toLowerCase(), b.slot_start);
  }

  const paidByEmail = new Map<string, string>();
  for (const o of (ordersRes.data ?? []) as {
    customer_email: string | null;
    payment_status: string;
    created_at: string;
  }[]) {
    if (!o.customer_email || o.payment_status !== "paid") continue;
    paidByEmail.set(o.customer_email.toLowerCase(), o.created_at);
  }

  let booked = 0;
  let won = 0;

  for (const p of prospects) {
    const email = p.contact_email?.toLowerCase() ?? null;
    const patch: Record<string, unknown> = {};

    const bookedAt = (p.lead_id ? bookingByLead.get(p.lead_id) : undefined) ?? (email ? bookingByEmail.get(email) : undefined);
    if (bookedAt && !p.booked_at) {
      patch["booked_at"] = bookedAt;
      if (["contacted", "replied"].includes(p.status)) patch["status"] = "meeting";
      booked += 1;
    }

    const paidAt = email ? paidByEmail.get(email) : undefined;
    if (paidAt && !p.won_at) {
      patch["won_at"] = paidAt;
      patch["status"] = "won";
      won += 1;
    }

    if (Object.keys(patch).length === 0) continue;
    patch["updated_at"] = new Date().toISOString();
    await db.from("prospects").update(patch).eq("id", p.id);
    if (patch["status"]) await syncLeadStage(p.lead_id, patch["status"] as string);
  }

  return { booked, won };
}
