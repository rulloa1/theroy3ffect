import { createServerFn } from "@tanstack/react-start";
import { DEPOSIT_BALANCE_CENTS } from "@/lib/commerce-catalog";
import {
  assertValidPriceId,
  assertValidPriceIds,
  assertValidSessionId,
  clampQuantity,
} from "@/lib/checkout-validation";

import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";

type CheckoutSessionResult = { clientSecret: string } | { error: string };

export const createCommissionCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      priceId: string;
      addOnPriceIds?: string[] | undefined;
      quantity?: number | undefined;
      tierLabel?: string | undefined;
      customerEmail?: string | undefined;
      userId?: string | undefined;
      returnUrl: string;
      environment: StripeEnv;
    }) => {
      assertValidPriceId(data.priceId);
      if (data.addOnPriceIds) assertValidPriceIds(data.addOnPriceIds);
      return data;
    },
  )
  .handler(async ({ data }): Promise<CheckoutSessionResult> => {
    try {
      const stripe = createStripeClient(data.environment);

      const requestedKeys = [data.priceId, ...(data.addOnPriceIds ?? [])];
      const prices = await stripe.prices.list({ lookup_keys: requestedKeys });

      const stripePrice = prices.data.find((p) => p.lookup_key === data.priceId);
      if (!stripePrice) throw new Error("Price not found");

      const isRecurring = stripePrice.type === "recurring";
      const quantity = clampQuantity(data.quantity);

      const productId =
        typeof stripePrice.product === "string" ? stripePrice.product : stripePrice.product.id;
      const product = await stripe.products.retrieve(productId);

      const balanceDue = (DEPOSIT_BALANCE_CENTS[data.priceId] ?? 0) * quantity;

      const lineItems: Array<{ price: string; quantity: number }> = [
        { price: stripePrice.id, quantity },
      ];

      if (data.addOnPriceIds && data.addOnPriceIds.length > 0) {
        for (const addOnKey of data.addOnPriceIds) {
          const addOnPrice = prices.data.find((p) => p.lookup_key === addOnKey);
          if (addOnPrice) {
            lineItems.push({ price: addOnPrice.id, quantity: 1 });
          }
        }
      }

      const metadata: Record<string, string> = {
        managed_payments: "false",
        price_lookup_key: data.priceId,
        is_deposit: balanceDue > 0 ? "true" : "false",
        balance_due_cents: String(balanceDue),
        ...(data.addOnPriceIds && data.addOnPriceIds.length > 0
          ? { addon_price_keys: data.addOnPriceIds.join(",") }
          : {}),
        ...(data.tierLabel ? { tier_label: data.tierLabel } : {}),
        ...(data.userId ? { user_id: data.userId } : {}),
      };

      const session = await stripe.checkout.sessions.create({
        line_items: lineItems,
        mode: isRecurring ? "subscription" : "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        automatic_tax: { enabled: true },
        billing_address_collection: "required",
        ...(isRecurring
          ? { subscription_data: { metadata } }
          : {
              customer_creation: "always",
              payment_intent_data: { description: product.name },
            }),
        ...(data.customerEmail && { customer_email: data.customerEmail }),
        metadata,
      });

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export type CheckoutSummary =
  | {
      status: "complete" | "open" | "expired";
      paymentStatus: string;
      productName: string | null;
      tierLabel: string | null;
      amountTotal: number;
      currency: string;
      customerEmail: string | null;
      isDeposit: boolean;
      balanceDueCents: number;
    }
  | { error: string };

/**
 * Public, read-only verification of a checkout session so confirmation and
 * brief pages render real data instead of trusting the URL.
 */
export const getCheckoutSessionSummary = createServerFn({ method: "GET" })
  .inputValidator((data: { sessionId: string; environment: StripeEnv }) => {
    assertValidSessionId(data.sessionId);
    return data;
  })
  .handler(async ({ data }): Promise<CheckoutSummary> => {
    try {
      const stripe = createStripeClient(data.environment);
      const session = await stripe.checkout.sessions.retrieve(data.sessionId, {
        expand: ["line_items"],
      });
      const line = session.line_items?.data?.[0];
      return {
        status: (session.status ?? "open") as "complete" | "open" | "expired",
        paymentStatus: session.payment_status ?? "unpaid",
        productName: line?.description ?? null,
        tierLabel: session.metadata?.["tier_label"] ?? null,
        amountTotal: session.amount_total ?? 0,
        currency: session.currency ?? "usd",
        customerEmail: session.customer_details?.email ?? null,
        isDeposit: session.metadata?.["is_deposit"] === "true",
        balanceDueCents: Number(session.metadata?.["balance_due_cents"] ?? 0),
      };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

// ---------- Deposit balance payments (portal) ----------

type BalancePayableOrder = {
  id: string;
  description: string;
  balanceDueCents: number;
  currency: string;
};

/** Orders belonging to the signed-in client that still owe a deposit balance. */
export const listMyBalanceDue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ orders: BalancePayableOrder[] }> => {
    const db = context.supabase as unknown as { from: (t: string) => any };
    const { data } = await db
      .from("orders")
      .select("id, tier_label, product_name, balance_due_cents, balance_status, currency")
      .eq("is_deposit", true)
      .neq("balance_status", "paid");
    const orders = ((data ?? []) as Record<string, unknown>[])
      .filter((o) => Number(o["balance_due_cents"] ?? 0) > 0)
      .map((o) => ({
        id: String(o["id"]),
        description: String(o["tier_label"] || o["product_name"] || "Commission balance"),
        balanceDueCents: Number(o["balance_due_cents"] ?? 0),
        currency: String(o["currency"] ?? "usd"),
      }));
    return { orders };
  });

/** Starts an embedded Stripe checkout for the remaining balance of one order. */
export const createBalanceCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orderId: string; returnUrl: string; environment: StripeEnv }) => {
    if (!/^[0-9a-f-]{36}$/i.test(data.orderId)) throw new Error("Invalid order");
    return data;
  })
  .handler(async ({ data, context }): Promise<CheckoutSessionResult> => {
    try {
      const db = context.supabase as unknown as { from: (t: string) => any };
      // RLS scopes orders to the signed-in client, so this also authorizes.
      const { data: order } = await db
        .from("orders")
        .select(
          "id, tier_label, product_name, balance_due_cents, balance_status, currency, customer_email, stripe_customer_id",
        )
        .eq("id", data.orderId)
        .maybeSingle();

      if (!order) return { error: "Order not found" };
      const balance = Number(order["balance_due_cents"] ?? 0);
      if (order["balance_status"] === "paid" || balance <= 0) {
        return { error: "This balance is already settled" };
      }

      const stripe = createStripeClient(data.environment);
      const label = String(order["tier_label"] || order["product_name"] || "Commission");
      const email = order["customer_email"] as string | null;

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        automatic_tax: { enabled: true },
        billing_address_collection: "required",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: String(order["currency"] ?? "usd"),
              unit_amount: balance,
              product_data: { name: `${label} — remaining balance` },
            },
          },
        ],
        ...(typeof order["stripe_customer_id"] === "string" && order["stripe_customer_id"]
          ? { customer: order["stripe_customer_id"] as string }
          : { customer_creation: "always", ...(email ? { customer_email: email } : {}) }),
        payment_intent_data: { description: `${label} balance` },
        metadata: {
          purpose: "commission_balance",
          order_id: String(order["id"]),
          user_id: context.userId,
          balance_due_cents: String(balance),
        },
      });

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

/** Confirms a balance checkout on return, so settlement doesn't depend on the webhook alone. */
export const confirmBalancePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { sessionId: string; environment: StripeEnv }) => {
    assertValidSessionId(data.sessionId);
    return data;
  })
  .handler(async ({ data }): Promise<{ paid: boolean; error?: string }> => {
    try {
      const stripe = createStripeClient(data.environment);
      const session = await stripe.checkout.sessions.retrieve(data.sessionId);
      if (session.payment_status === "unpaid") return { paid: false };
      const { settleCommissionBalance } = await import("@/lib/booking/balance-payment.server");
      await settleCommissionBalance({
        sessionId: session.id,
        amountTotal: session.amount_total ?? 0,
        metadata: (session.metadata ?? {}) as Record<string, string | undefined>,
      });
      return { paid: true };
    } catch (error) {
      return { paid: false, error: getStripeErrorMessage(error) };
    }
  });
