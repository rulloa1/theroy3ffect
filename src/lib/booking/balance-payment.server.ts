/**
 * Settlement for paid commission balance checkout sessions.
 *
 * Called by both the webhook handler and confirmBalancePayment on return.
 * Idempotently marks the matching order's balance_status as "paid".
 */

export interface BalanceSettlementSession {
  sessionId: string;
  amountTotal: number;
  metadata: Record<string, string | undefined>;
}

export async function settleCommissionBalance(input: BalanceSettlementSession): Promise<void> {
  const orderId = input.metadata["order_id"];
  if (!orderId) {
    console.error("settleCommissionBalance: missing order_id in metadata");
    return;
  }

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

  if (error) {
    console.error("settleCommissionBalance: database update failed:", error.message);
  }
}
