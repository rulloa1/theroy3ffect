/**
 * Fulfilment for a proposal's kickoff deposit.
 *
 * Both the payments webhook and the proposal page's return URL call this, so it
 * is idempotent on the Stripe checkout session id — the same key the unique
 * index in the database enforces.
 */

export interface ProposalDepositSession {
  id: string;
  amountTotal: number;
  metadata: Record<string, string | undefined>;
}

export async function fulfillProposalDeposit(
  session: ProposalDepositSession,
): Promise<{ status: "paid" | "already_paid" | "invalid" | "error" }> {
  const proposalId = session.metadata["proposal_id"];
  if (!proposalId) return { status: "invalid" };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: proposal } = await supabaseAdmin
    .from("project_proposals")
    .select("id, deposit_cents, deposit_paid_at, deposit_session_id")
    .eq("id", proposalId)
    .maybeSingle();

  if (!proposal) return { status: "invalid" };

  if (proposal.deposit_paid_at) {
    // A different session paying an already-paid deposit means the client was
    // charged twice (two tabs, or a retried checkout). Nothing here can refund
    // it, so make it loud instead of dropping it.
    if (proposal.deposit_session_id && proposal.deposit_session_id !== session.id) {
      console.error(
        `REFUND REQUIRED: proposal ${proposalId} deposit paid twice — sessions ${proposal.deposit_session_id} and ${session.id}`,
      );
    }
    return { status: "already_paid" };
  }

  // Tax can sit on top of the deposit, so this is a floor, not an equality.
  if (session.amountTotal < Number(proposal.deposit_cents ?? 0)) {
    console.error(
      `Proposal ${proposalId} deposit underpaid: ${session.amountTotal} < ${proposal.deposit_cents} (session ${session.id})`,
    );
    return { status: "invalid" };
  }

  const { data, error } = await supabaseAdmin
    .from("project_proposals")
    .update({
      deposit_session_id: session.id,
      deposit_paid_at: new Date().toISOString(),
      deposit_paid_cents: session.amountTotal,
    })
    .eq("id", proposalId)
    .is("deposit_paid_at", null)
    .select("id");

  if (error) {
    // A unique violation means the other fulfilment path won the race.
    if (error.code === "23505") return { status: "already_paid" };
    console.error("Proposal deposit fulfilment failed:", error.message);
    return { status: "error" };
  }

  return { status: data && data.length > 0 ? "paid" : "already_paid" };
}
