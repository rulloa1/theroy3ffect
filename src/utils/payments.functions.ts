import { createServerFn } from "@tanstack/react-start";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";

type CheckoutSessionResult = { clientSecret: string } | { error: string };

export const createCommissionCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      priceId: string;
      quantity?: number | undefined;
      tierLabel?: string | undefined;
      customerEmail?: string | undefined;
      returnUrl: string;
      environment: StripeEnv;
    }) => {
      if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error("Invalid priceId");
      return data;
    },
  )
  .handler(async ({ data }): Promise<CheckoutSessionResult> => {
    try {
      const stripe = createStripeClient(data.environment);

      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      const stripePrice = prices.data[0];
      if (!stripePrice) throw new Error("Price not found");

      const isRecurring = stripePrice.type === "recurring";
      const quantity = Math.min(Math.max(data.quantity ?? 1, 1), 10);

      const productId =
        typeof stripePrice.product === "string"
          ? stripePrice.product
          : stripePrice.product.id;
      const product = await stripe.products.retrieve(productId);

      const metadata: Record<string, string> = {
        managed_payments: "false",
        price_lookup_key: data.priceId,
        ...(data.tierLabel ? { tier_label: data.tierLabel } : {}),
      };

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity }],
        mode: isRecurring ? "subscription" : "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        automatic_tax: { enabled: true },
        ...(isRecurring
          ? { subscription_data: { metadata } }
          : { payment_intent_data: { description: product.name } }),
        ...(data.customerEmail && { customer_email: data.customerEmail }),
        metadata,
      });

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
