import { z } from "zod";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";
import { escapeLikePattern } from "@/lib/sql-like";

export const OWNER_EMAIL = "rory@theroyeffect.com";
export const SITE = "https://www.theroyeffect.com";
export const QUESTIONNAIRE_URL = `${SITE}/brief`;
export const BOOKING_TZ = "America/Chicago";
/** Discovery slots offered daily, expressed in UTC hours (10am / 1pm / 3pm Central). */
export const SLOT_HOURS_UTC = [15, 18, 20] as const;
export const SLOT_MINUTES = 15;
/** Shared so a caller can tell a lost slot apart from a broken query. */
export const SLOT_TAKEN_MESSAGE = "That time was just taken.";

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
      .ilike("email", escapeLikePattern(emailValue))
      .limit(1)
      .maybeSingle();
    if (existing?.id) {
      const update: Record<string, unknown> = { ...payload, vapi_call_id: callId };
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

  const taken = new Set(
    (booked ?? []).map((b: { slot_start: string }) => new Date(b.slot_start).toISOString()),
  );
  return candidates.filter((c) => !taken.has(c.toISOString())).slice(0, count * 3);
}

/** Payment facts recorded on the booking row in the same insert that reserves the slot. */
export interface BookingPaymentDetails {
  stripe_session_id: string;
  amount_paid_cents: number;
  currency: string;
  sms_service_consent: boolean;
  sms_marketing_consent: boolean;
}

export interface BookingResult {
  booking_id: string;
  spoken_time: string;
  time_zone: string;
  /** True when this slot was already reserved by the same Stripe session. */
  already_booked?: boolean;
}

/**
 * True when the time is one of the slots the site actually offers.
 * `getAvailableSlots` only ever hands out these, so anything else is a caller
 * inventing a time — a 3am booking, or a way to fill the calendar with junk.
 */
export function isOfferedSlot(start: Date): boolean {
  const weekday = start.getUTCDay();
  if (weekday === 0 || weekday === 6) return false;
  if (!(SLOT_HOURS_UTC as readonly number[]).includes(start.getUTCHours())) return false;
  return start.getUTCMinutes() === 0 && start.getUTCSeconds() === 0;
}

export async function bookDiscoverySlot(
  input: BookingSlotInput,
  payment?: BookingPaymentDetails,
): Promise<BookingResult> {
  const data = bookingSlotSchema.parse(input);
  const start = new Date(data.slot_start);
  if (Number.isNaN(start.getTime()) || start.getTime() < Date.now()) {
    throw new Error("That time is no longer available.");
  }
  if (!isOfferedSlot(start)) {
    throw new Error("That time isn't one of the slots on offer.");
  }
  const end = new Date(start.getTime() + SLOT_MINUTES * 60_000);
  const db = await admin();

  // Fast path for a friendly message. The real guarantee is the partial unique
  // index on (slot_start) where status = 'scheduled', enforced on insert below —
  // this check alone loses the race between two simultaneous payments.
  const { data: clash } = await db
    .from("voice_bookings")
    .select("id")
    .eq("slot_start", start.toISOString())
    .eq("status", "scheduled")
    .limit(1)
    .maybeSingle();
  if (clash?.id) {
    throw new Error(SLOT_TAKEN_MESSAGE);
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

  // The Stripe session id goes in with the row, not in a follow-up update: as an
  // update it was written after the insert, so it could not serve as the
  // fulfilment key for the two callers racing to fulfil the same payment, and a
  // failed update left a booking with no session id holding the slot forever.
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
      ...(payment
        ? {
            stripe_session_id: payment.stripe_session_id,
            payment_status: "paid",
            amount_paid_cents: payment.amount_paid_cents,
            currency: payment.currency,
            sms_service_consent: payment.sms_service_consent,
            sms_marketing_consent: payment.sms_marketing_consent,
            consent_captured_at: new Date().toISOString(),
          }
        : {}),
    })
    .select("id")
    .single();

  if (error) {
    // 23505 = unique violation: the slot, this session, or this email+slot pair
    // was claimed between the check above and this insert.
    if (error.code === "23505" && payment) {
      const { data: mine } = await db
        .from("voice_bookings")
        .select("id, slot_start, time_zone")
        .eq("stripe_session_id", payment.stripe_session_id)
        .limit(1)
        .maybeSingle();
      if (mine?.id) {
        return {
          booking_id: mine.id as string,
          spoken_time: formatSlot(new Date(mine.slot_start as string)),
          time_zone: (mine.time_zone as string) ?? BOOKING_TZ,
          already_booked: true,
        };
      }
    }
    if (error.code === "23505") {
      if (payment) {
        // Paid, but somebody else holds the slot: retrying will never succeed,
        // so say so loudly rather than letting the caller loop for days.
        console.error(
          `REFUND REQUIRED: session ${payment.stripe_session_id} paid for ${start.toISOString()}, which is already booked`,
        );
      }
      throw new Error(SLOT_TAKEN_MESSAGE);
    }
    throw new Error(error.message);
  }

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
