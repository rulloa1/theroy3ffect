import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/utils/require-admin";

const envSchema = z.enum(["sandbox", "live"]);

/**
 * Admin-only: register the studio's business address as the tax origin so
 * automatic tax can be calculated on portal invoices and checkouts.
 */
export const adminConfigureTaxOrigin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { env: "sandbox" | "live" }) => ({
    env: envSchema.parse(input?.env),
  }))
  .handler(
    async ({
      context,
      data,
    }): Promise<{ success: boolean; status?: string; error?: string }> => {
      await assertAdmin(context);
      const { createStripeClient, getStripeErrorMessage } = await import("@/lib/stripe.server");
      try {
        const stripe = createStripeClient(data.env);
        const settings = await stripe.tax.settings.update({
          defaults: { tax_behavior: "exclusive" },
          head_office: {
            address: {
              line1: "463 Sevenhampton Ln",
              city: "Houston",
              state: "TX",
              postal_code: "77015",
              country: "US",
            },
          },
        });
        return { success: true, status: settings.status };
      } catch (err) {
        return { success: false, error: getStripeErrorMessage(err) };
      }
    },
  );
