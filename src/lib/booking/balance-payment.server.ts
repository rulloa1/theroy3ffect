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

async function admin() {
  const mod = await import("@/integrations/supabase/client.server");
  return (mod as unknown as { supabaseAdmin: any }).supabaseAdmin;
}

export async function settleCommissionBalance(session: BalanceSettlementSession) {
  const orderId = session.metadata["order_id"];
  if (!orderId) {
    console.error("settleCommissionBalance: missing order_id in metadata");
    return;
  }

  const db = await admin();
  const { error } = await db
    .from("orders")
    .update({
      balance_status: "paid",
    })
    .eq("id", orderId)
    .neq("balance_status", "paid");

  if (error) {
    console.error("settleCommissionBalance: database update failed:", error.message);
  }
}
