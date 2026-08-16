import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";

const env = (value: unknown): StripeEnv => (value === "live" ? "live" : "sandbox");

export interface AccountOrder {
  id: string;
  stripe_session_id: string;
  product_name: string | null;
  tier_label: string | null;
  amount_total: number;
  currency: string;
  payment_status: string;
  purchase_kind: string;
  is_deposit: boolean;
  balance_due_cents: number;
  balance_status: string;
  balance_invoice_url: string | null;
  amount_refunded: number;
  created_at: string;
}

export interface AccountSubscription {
  id: string;
  stripe_subscription_id: string;
  product_name: string | null;
  status: string;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  latest_invoice_status: string | null;
}

export interface AccountInvoice {
  id: string;
  description: string | null;
  amount_paid: number;
  amount_due: number;
  currency: string;
  status: string;
  hosted_invoice_url: string | null;
  period_end: string | null;
  billing_reason: string | null;
  created_at: string;
}

export interface AccountBrief {
  id: string;
  project_type: string;
  goals?: string | null;
  pdf_path: string | null;
  pdf_url?: string | null;
  project_status?: string | null;
  project_notes?: string | null;
  project_links?: string | null;
  created_at: string;
  stripe_session_id: string | null;
}

export interface AccountSnapshot {
  email: string | null;
  fullName: string | null;
  isAdmin: boolean;
  orders: AccountOrder[];
  subscriptions: AccountSubscription[];
  invoices: AccountInvoice[];
  briefs: AccountBrief[];
}

/** Everything the signed-in client can see about their own account. */
export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: StripeEnv }) => ({
    environment: env(data.environment),
  }))
  .handler(async ({ data, context }): Promise<AccountSnapshot> => {
    const { supabase, userId } = context;

    const [profile, orders, subs, invoices, briefs, adminRole] = await Promise.all([
      supabase.from("profiles").select("email, full_name").eq("id", userId).maybeSingle(),
      supabase
        .from("orders")
        .select(
          "id, stripe_session_id, product_name, tier_label, amount_total, currency, payment_status, purchase_kind, is_deposit, balance_due_cents, balance_status, balance_invoice_url, amount_refunded, created_at",
        )
        .eq("user_id", userId)
        .eq("environment", data.environment)
        .order("created_at", { ascending: false }),
      supabase
        .from("retainer_subscriptions")
        .select(
          "id, stripe_subscription_id, product_name, status, cancel_at_period_end, current_period_end, latest_invoice_status",
        )
        .eq("user_id", userId)
        .eq("environment", data.environment)
        .order("created_at", { ascending: false }),
      supabase
        .from("subscription_invoices")
        .select(
          "id, description, amount_paid, amount_due, currency, status, hosted_invoice_url, period_end, billing_reason, created_at",
        )
        .eq("user_id", userId)
        .eq("environment", data.environment)
        .order("created_at", { ascending: false })
        .limit(24),
      supabase
        .from("project_briefs")
        .select("id, project_type, goals, pdf_path, project_status, project_notes, project_links, created_at, stripe_session_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    ]);

    const briefsWithUrls: AccountBrief[] = await Promise.all(
      (briefs.data ?? []).map(async (b: any) => {
        let pdf_url: string | null = null;
        if (b.pdf_path) {
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { data: signed } = await supabaseAdmin.storage
              .from("brief-pdfs")
              .createSignedUrl(b.pdf_path, 3600);
            pdf_url = signed?.signedUrl ?? null;
          } catch {}
        }
        return {
          id: b.id,
          project_type: b.project_type,
          goals: b.goals ?? null,
          pdf_path: b.pdf_path ?? null,
          pdf_url,
          project_status: b.project_status ?? "brief_received",
          project_notes: b.project_notes ?? null,
          project_links: b.project_links ?? null,
          created_at: b.created_at,
          stripe_session_id: b.stripe_session_id ?? null,
        };
      }),
    );

    return {
      email: profile.data?.email ?? null,
      fullName: profile.data?.full_name ?? null,
      isAdmin: adminRole.data === true,
      orders: (orders.data ?? []) as AccountOrder[],
      subscriptions: (subs.data ?? []) as AccountSubscription[],
      invoices: (invoices.data ?? []) as AccountInvoice[],
      briefs: briefsWithUrls,
    };
  });

/** Opens the payment provider's hosted billing portal for this client. */
export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl: string; environment: StripeEnv }) => ({
    returnUrl: data.returnUrl,
    environment: env(data.environment),
  }))
  .handler(async ({ data, context }): Promise<{ url: string } | { error: string }> => {
    const { supabase, userId } = context;

    const [sub, order] = await Promise.all([
      supabase
        .from("retainer_subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", userId)
        .eq("environment", data.environment)
        .not("stripe_customer_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("orders")
        .select("stripe_customer_id")
        .eq("user_id", userId)
        .eq("environment", data.environment)
        .not("stripe_customer_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const customerId = sub.data?.stripe_customer_id ?? order.data?.stripe_customer_id;
    if (!customerId) return { error: "No billing records found for this account yet." };

    try {
      const stripe = createStripeClient(data.environment);
      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: data.returnUrl,
      });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

/**
 * Links a checkout session to the signed-in account when the paying email
 * matches. Used right after checkout so the portal is populated immediately.
 */
export const claimCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { sessionId: string; environment: StripeEnv }) => {
    if (!/^cs_[a-zA-Z0-9_]+$/.test(data.sessionId)) throw new Error("Invalid session id");
    return { sessionId: data.sessionId, environment: env(data.environment) };
  })
  .handler(async ({ data, context }): Promise<{ claimed: boolean }> => {
    const { userId, claims } = context;
    const userEmail = (claims as { email?: string }).email?.toLowerCase();
    if (!userEmail) return { claimed: false };

    const stripe = createStripeClient(data.environment);
    const session = await stripe.checkout.sessions.retrieve(data.sessionId);
    const paidEmail = (session.customer_details?.email ?? session.customer_email ?? "").toLowerCase();
    if (!paidEmail || paidEmail !== userEmail) return { claimed: false };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("orders")
      .update({ user_id: userId })
      .eq("stripe_session_id", data.sessionId)
      .is("user_id", null);
    return { claimed: true };
  });
