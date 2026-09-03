import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertValidSessionId } from "@/lib/checkout-validation";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";

const DISCOVERY_PRICE_KEY = "discovery_call_fee";

const checkoutInputSchema = z.object({
  full_name: z.string().trim().min(1, "Please add your name").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(40).optional(),
  slot_start: z.string().trim().min(10).max(40),
  time_zone: z.string().trim().max(60).default("America/Chicago"),
  notes: z.string().trim().max(2000).optional(),
  returnUrl: z.string().trim().url().max(500),
  environment: z.enum(["sandbox", "live"]),
});

type CheckoutResult = { clientSecret: string } | { error: string };

/**
 * Starts a paid discovery booking. The slot is checked for availability here,
 * but only reserved once Stripe confirms payment (webhook / return page).
 */
export const createDiscoveryCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => checkoutInputSchema.parse(input))
  .handler(async ({ data }): Promise<CheckoutResult> => {
    try {
      const start = new Date(data.slot_start);
      if (Number.isNaN(start.getTime()) || start.getTime() < Date.now()) {
        return { error: "That time is no longer available." };
      }

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: clash } = await supabaseAdmin
        .from("voice_bookings")
        .select("id")
        .eq("slot_start", start.toISOString())
        .eq("status", "scheduled")
        .limit(1)
        .maybeSingle();
      if (clash?.id) return { error: "That time was just taken." };

      const stripe = createStripeClient(data.environment as StripeEnv);
      const prices = await stripe.prices.list({ lookup_keys: [DISCOVERY_PRICE_KEY] });
      const price = prices.data.find((p) => p.lookup_key === DISCOVERY_PRICE_KEY);
      if (!price) return { error: "The discovery call fee is not configured yet." };

      const metadata: Record<string, string> = {
        purpose: "discovery_call",
        price_lookup_key: DISCOVERY_PRICE_KEY,
        managed_payments: "false",
        is_deposit: "false",
        balance_due_cents: "0",
        tier_label: "Discovery Call",
        full_name: data.full_name,
        email: data.email,
        slot_start: start.toISOString(),
        time_zone: data.time_zone,
        ...(data.phone ? { phone: data.phone } : {}),
        ...(data.notes ? { notes: data.notes.slice(0, 450) } : {}),
      };

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: price.id, quantity: 1 }],
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        automatic_tax: { enabled: true },
        billing_address_collection: "required",
        customer_creation: "always",
        customer_email: data.email,
        payment_intent_data: { description: "Discovery Call (15 minutes)" },
        metadata,
      });

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export type DiscoveryConfirmation =
  | { status: "booked" | "already_booked"; spokenTime: string; timeZone: string }
  | { status: "pending" | "invalid"; message: string };

/**
 * Return-page fallback: confirms the payment directly with Stripe and books the
 * slot if the webhook has not landed yet. Idempotent on the session id.
 */
export const confirmDiscoveryPayment = createServerFn({ method: "POST" })
  .inputValidator((input: { sessionId: string; environment: StripeEnv }) => {
    assertValidSessionId(input.sessionId);
    return input;
  })
  .handler(async ({ data }): Promise<DiscoveryConfirmation> => {
    try {
      const stripe = createStripeClient(data.environment);
      const session = await stripe.checkout.sessions.retrieve(data.sessionId);

      if (session.metadata?.["purpose"] !== "discovery_call") {
        return { status: "invalid", message: "That payment is not a discovery call." };
      }
      if (session.payment_status === "unpaid") {
        return { status: "pending", message: "Payment is still processing." };
      }

      const { fulfillPaidDiscoveryBooking } = await import(
        "@/lib/booking/discovery-payment.server"
      );
      const result = await fulfillPaidDiscoveryBooking({
        id: session.id,
        amountTotal: session.amount_total ?? 0,
        currency: session.currency ?? "usd",
        email: session.customer_details?.email ?? session.customer_email ?? null,
        metadata: (session.metadata ?? {}) as Record<string, string | undefined>,
      });

      if (result.status === "invalid") {
        return { status: "invalid", message: result.message ?? "Booking details were missing." };
      }
      return {
        status: result.status,
        spokenTime: result.spokenTime ?? "",
        timeZone: result.timeZone ?? "America/Chicago",
      };
    } catch (error) {
      return { status: "invalid", message: getStripeErrorMessage(error) };
    }
  });
