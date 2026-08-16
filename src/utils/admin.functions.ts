import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";

const env = (value: unknown): StripeEnv => (value === "live" ? "live" : "sandbox");

async function assertAdmin(context: {
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> };
  userId: string;
}) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (data !== true) throw new Error("Forbidden");
}

export interface AdminOrder {
  id: string;
  stripe_session_id: string;
  customer_email: string | null;
  customer_name: string | null;
  product_name: string | null;
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

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: StripeEnv }) => ({ environment: env(data.environment) }))
  .handler(async ({ data, context }): Promise<{ orders: AdminOrder[] }> => {
    await assertAdmin(context as never);
    const { data: orders } = await context.supabase
      .from("orders")
      .select(
        "id, stripe_session_id, customer_email, customer_name, product_name, amount_total, currency, payment_status, purchase_kind, is_deposit, balance_due_cents, balance_status, balance_invoice_url, amount_refunded, created_at",
      )
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(100);
    return { orders: (orders ?? []) as AdminOrder[] };
  });

/**
 * Invoices the remaining balance on a deposit order. Creates (or reuses) the
 * customer, adds a single line item for the outstanding amount, finalizes and
 * emails the hosted invoice.
 */
export const adminSendBalanceInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orderId: string; environment: StripeEnv }) => ({
    orderId: data.orderId,
    environment: env(data.environment),
  }))
  .handler(async ({ data, context }): Promise<{ url: string } | { error: string }> => {
    await assertAdmin(context as never);

    const { data: order } = await context.supabase
      .from("orders")
      .select(
        "id, stripe_customer_id, customer_email, customer_name, product_name, balance_due_cents, balance_status, currency",
      )
      .eq("id", data.orderId)
      .maybeSingle();

    if (!order) return { error: "Order not found" };
    if (order.balance_due_cents <= 0) return { error: "This order has no outstanding balance." };
    if (order.balance_status === "invoiced" || order.balance_status === "paid")
      return { error: "The balance has already been invoiced." };

    try {
      const stripe = createStripeClient(data.environment);

      let customerId = order.stripe_customer_id;
      if (!customerId) {
        if (!order.customer_email) return { error: "No customer email on this order." };
        const created = await stripe.customers.create({
          email: order.customer_email,
          ...(order.customer_name ? { name: order.customer_name } : {}),
        });
        customerId = created.id;
      }

      const invoice = await stripe.invoices.create({
        customer: customerId,
        collection_method: "send_invoice",
        days_until_due: 7,
        description: `Remaining balance — ${order.product_name ?? "Commission"}`,
        auto_advance: false,
        metadata: { order_id: order.id, kind: "deposit_balance" },
      });

      await stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        amount: order.balance_due_cents,
        currency: order.currency,
        description: `Remaining 50% balance — ${order.product_name ?? "Commission"}`,
      });

      const finalized = await stripe.invoices.finalizeInvoice(invoice.id as string);
      await stripe.invoices.sendInvoice(invoice.id as string);

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("orders")
        .update({
          balance_status: "invoiced",
          balance_invoice_id: finalized.id,
          balance_invoice_url: finalized.hosted_invoice_url ?? null,
        })
        .eq("id", order.id);

      return { url: finalized.hosted_invoice_url ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
