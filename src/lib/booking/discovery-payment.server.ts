/**
 * Fulfilment for paid discovery calls.
 *
 * The slot is only reserved once Stripe reports the checkout as paid. Both the
 * webhook and the return page call `fulfillPaidDiscoveryBooking`, so it must be
 * idempotent — the Stripe checkout session id is the fulfilment key.
 */
import { bookDiscoverySlot, formatSlot, BOOKING_TZ } from "@/utils/booking.server";

export const DISCOVERY_PRICE_KEY = "discovery_call_fee";
export const DISCOVERY_FEE_CENTS = 4900;

export interface DiscoveryPaymentSession {
  id: string;
  amountTotal: number;
  currency: string;
  email: string | null;
  metadata: Record<string, string | undefined>;
}

export interface DiscoveryFulfilmentResult {
  status: "booked" | "already_booked" | "invalid";
  bookingId?: string;
  spokenTime?: string;
  timeZone?: string;
  message?: string;
}

async function admin() {
  const mod = await import("@/integrations/supabase/client.server");
  return (mod as unknown as { supabaseAdmin: any }).supabaseAdmin;
}

/**
 * Mirrors the paid discovery call into the client portal so the client sees a
 * completed milestone the moment the payment lands.
 */
async function syncPortalDiscoveryMilestone(input: {
  email: string;
  fullName: string;
  spoken: string;
  amountLabel: string;
}) {
  const db = await admin();
  const email = input.email.toLowerCase();

  const { data: existingProject } = await db
    .from("client_projects")
    .select("id")
    .ilike("client_email", email)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let projectId = existingProject?.id as string | undefined;

  if (!projectId) {
    const { data: created, error } = await db
      .from("client_projects")
      .insert({
        client_email: email,
        title: `${input.fullName} — Discovery`,
        summary: "Started from a paid discovery call booked on the site.",
        status: "onboarding",
      })
      .select("id")
      .single();
    if (error) {
      console.error("Portal project creation failed:", error.message);
      return;
    }
    projectId = created.id as string;
  }

  const title = "Discovery call";
  const note = `Paid ${input.amountLabel} · ${input.spoken} (${BOOKING_TZ})`;

  const { data: milestone } = await db
    .from("client_milestones")
    .select("id")
    .eq("project_id", projectId)
    .eq("title", title)
    .limit(1)
    .maybeSingle();

  if (milestone?.id) {
    await db
      .from("client_milestones")
      .update({ status: "done", note, updated_at: new Date().toISOString() })
      .eq("id", milestone.id);
    return;
  }

  await db
    .from("client_milestones")
    .insert({ project_id: projectId, title, note, status: "done", position: 0 });
}

export async function fulfillPaidDiscoveryBooking(
  session: DiscoveryPaymentSession,
): Promise<DiscoveryFulfilmentResult> {
  const db = await admin();

  const { data: existing } = await db
    .from("voice_bookings")
    .select("id, slot_start, time_zone")
    .eq("stripe_session_id", session.id)
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    return {
      status: "already_booked",
      bookingId: existing.id as string,
      spokenTime: formatSlot(new Date(existing.slot_start as string)),
      timeZone: (existing.time_zone as string) ?? BOOKING_TZ,
    };
  }

  const meta = session.metadata;
  const slotStart = meta["slot_start"];
  const fullName = meta["full_name"];
  const email = meta["email"] ?? session.email ?? undefined;

  if (!slotStart || !fullName || !email) {
    return { status: "invalid", message: "Booking details were missing from the payment." };
  }

  const booking = await bookDiscoverySlot({
    full_name: fullName,
    email,
    ...(meta["phone"] ? { phone: meta["phone"] } : {}),
    slot_start: slotStart,
    time_zone: meta["time_zone"] || BOOKING_TZ,
    ...(meta["notes"] ? { notes: meta["notes"] } : {}),
  });

  await db
    .from("voice_bookings")
    .update({
      stripe_session_id: session.id,
      payment_status: "paid",
      amount_paid_cents: session.amountTotal,
      currency: session.currency,
    })
    .eq("id", booking.booking_id);

  const amountLabel = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (session.currency || "usd").toUpperCase(),
  }).format(session.amountTotal / 100);

  try {
    await syncPortalDiscoveryMilestone({
      email,
      fullName,
      spoken: booking.spoken_time,
      amountLabel,
    });
  } catch (error) {
    console.error("Portal milestone sync failed:", error);
  }

  return {
    status: "booked",
    bookingId: booking.booking_id,
    spokenTime: booking.spoken_time,
    timeZone: booking.time_zone,
  };
}
