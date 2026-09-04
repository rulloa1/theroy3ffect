/**
 * Settles the remaining balance on a deposit commission after a Stripe
 * balance checkout completes. Idempotent: safe for webhook retries and for
 * the client-side confirmation call that runs on the portal return URL.
 */
export async function settleCommissionBalance(input: {
  sessionId: string;
  amountTotal: number;
  metadata: Record<string, string | undefined>;
}): Promise<void> {
  const orderId = input.metadata["order_id"];
  if (!orderId) return;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, balance_status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.balance_status === "paid") return;

  const { error } = await supabaseAdmin
    .from("orders")
    .update({
      balance_status: "paid",
      balance_session_id: input.sessionId,
      balance_paid_at: new Date().toISOString(),
      balance_paid_cents: input.amountTotal,
    })
    .eq("id", orderId)
    .neq("balance_status", "paid");

  if (error) console.error("Balance settlement failed:", error.message);
}
