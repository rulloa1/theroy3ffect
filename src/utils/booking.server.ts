import { z } from "zod";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";

export const OWNER_EMAIL = "rory@theroyeffect.com";
export const SITE = "https://www.theroyeffect.com";
export const QUESTIONNAIRE_URL = `${SITE}/brief`;
export const BOOKING_TZ = "America/Chicago";
/** Discovery slots offered daily, expressed in UTC hours (10am / 1pm / 3pm Central). */
export const SLOT_HOURS_UTC = [15, 18, 20] as const;
export const SLOT_MINUTES = 15;

export const bookingSlotSchema = z.object({
  full_name: z.string().trim().min(1, "Please add your name").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(40).optional(),
  slot_start: z.string().trim().min(10).max(40),
  time_zone: z.string().trim().max(60).default("America/Chicago"),
  notes: z.string().trim().max(2000).optional(),
});

export type BookingSlotInput = z.infer<typeof bookingSlotSchema>;

export function formatSlot(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: BOOKING_TZ,
  }).format(date);
}

async function admin() {
  const mod = await import("@/integrations/supabase/client.server");
  return (mod as unknown as { supabaseAdmin: any }).supabaseAdmin;
}

/**
 * Lead-stage vocabulary from the approved call-flow state machine, ordered by
 * pipeline progress. A later tool call must never pull a lead backwards (e.g.
 * a second `capture_lead` on a caller who already booked a discovery call).
 */
export const LEAD_STAGE_ORDER = [
  "new",
  "acknowledged",
  "awaiting_information",
  "audit_in_progress",
  "audit_delivered",
  "discovery_invited",
  "discovery_scheduled",
  "qualification_in_progress",
  "proposal_in_progress",
  "proposal_sent",
  "won",
] as const;

/** Stages outside the linear ladder that any update may set. */
const TERMINAL_STAGES = new Set(["nurture", "dormant", "not_a_fit", "human_followup_required"]);

export function resolveStage(current: unknown, next: unknown): string | undefined {
  if (typeof next !== "string") return undefined;
  if (typeof current !== "string" || current === next) return next;
  if (TERMINAL_STAGES.has(next) || TERMINAL_STAGES.has(current)) return next;
  const order = LEAD_STAGE_ORDER as readonly string[];
  const currentRank = order.indexOf(current);
  const nextRank = order.indexOf(next);
  if (currentRank === -1 || nextRank === -1) return next;
  return nextRank >= currentRank ? next : current;
}

export async function upsertLead(payload: Record<string, unknown>, callId: string | null) {
  const db = await admin();
  const emailValue = typeof payload["email"] === "string" ? (payload["email"] as string) : null;

  if (emailValue) {
    const { data: existing } = await db
      .from("voice_leads")
      .select("id, stage")
      .ilike("email", emailValue)
      .limit(1)
      .maybeSingle();
    if (existing?.id) {
      const update = { ...payload, vapi_call_id: callId };
      const stage = resolveStage(existing.stage, payload["stage"]);
      if (stage === undefined) delete update["stage"];
      else update["stage"] = stage;
      await db.from("voice_leads").update(update).eq("id", existing.id);
      return existing.id as string;
    }
  }

  const { data, error } = await db
    .from("voice_leads")
    .insert({ ...payload, vapi_call_id: callId })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function getAvailableSlots(count = 3) {
  const db = await admin();
  const now = Date.now();
  const candidates: Date[] = [];

  for (let dayOffset = 1; dayOffset <= 10 && candidates.length < count * 4; dayOffset += 1) {
    const day = new Date(now + dayOffset * 86_400_000);
    const weekday = day.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    for (const hour of SLOT_HOURS_UTC) {
      const slot = new Date(
        Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hour, 0, 0),
      );
      if (slot.getTime() > now) candidates.push(slot);
    }
  }

  const { data: booked } = await db
    .from("voice_bookings")
    .select("slot_start")
    .gte("slot_start", new Date(now).toISOString())
    .eq("status", "scheduled");

  const taken = new Set((booked ?? []).map((b: { slot_start: string }) => new Date(b.slot_start).toISOString()));
  return candidates.filter((c) => !taken.has(c.toISOString())).slice(0, count * 3);
}

export async function bookDiscoverySlot(input: BookingSlotInput) {
  const data = bookingSlotSchema.parse(input);
  const start = new Date(data.slot_start);
  if (Number.isNaN(start.getTime()) || start.getTime() < Date.now()) {
    throw new Error("That time is no longer available.");
  }
  const end = new Date(start.getTime() + SLOT_MINUTES * 60_000);
  const db = await admin();

  const { data: clash } = await db
    .from("voice_bookings")
    .select("id")
    .eq("slot_start", start.toISOString())
    .eq("status", "scheduled")
    .limit(1)
    .maybeSingle();
  if (clash?.id) {
    throw new Error("That time was just taken.");
  }

  const leadId = await upsertLead(
    {
      full_name: data.full_name,
      email: data.email,
      phone: data.phone ?? null,
      consent_to_follow_up: true,
      stage: "discovery_scheduled",
      source: "website_booking",
    },
    null,
  );

  const { data: row, error } = await db
    .from("voice_bookings")
    .insert({
      lead_id: leadId,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone ?? null,
      slot_start: start.toISOString(),
      slot_end: end.toISOString(),
      time_zone: data.time_zone,
      status: "scheduled",
      vapi_call_id: null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const spoken = formatSlot(start);

  await sendTemplateEmail("booking-confirmation", data.email, {
    templateData: {
      spoken,
      time_zone: BOOKING_TZ,
      notes: data.notes,
      questionnaire_url: QUESTIONNAIRE_URL,
    },
    idempotencyKey: `booking-confirmation-${row.id}`,
    replyTo: OWNER_EMAIL,
  }).catch((e) => console.error("Booking confirmation email failed:", e));

  await sendTemplateEmail("booking-notification", OWNER_EMAIL, {
    templateData: {
      name: data.full_name,
      email: data.email,
      phone: data.phone,
      when: `${spoken} (${BOOKING_TZ})`,
      notes: data.notes,
    },
    idempotencyKey: `booking-notification-${row.id}`,
    replyTo: data.email,
  }).catch((e) => console.error("Booking notification email failed:", e));

  return { booking_id: row.id, spoken_time: spoken, time_zone: BOOKING_TZ };
}
