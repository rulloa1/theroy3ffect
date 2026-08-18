import { useState } from "react";
import { Briefcase, Clock, FileText, Mail, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import type { AdminBrief, AdminOrder } from "@/utils/admin.functions";

export type FilterTab = "ALL" | "PENDING_BALANCE" | "PAID_IN_FULL" | "RETAINERS" | "REFUNDED";

export const MILESTONES = [
  { id: "brief_received", label: "1. Brief Received" },
  { id: "direction_locked", label: "2. Direction Locked" },
  { id: "design_build", label: "3. Design & Build" },
  { id: "in_review", label: "4. Review Rounds" },
  { id: "completed", label: "5. Completed & Live" },
];

export interface AdminProjectsViewProps {
  orders: AdminOrder[];
  filterTab: FilterTab;
  setFilterTab: (tab: FilterTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSendInvoice: (orderId: string) => Promise<void>;
  onUpdateMilestone: (orderId: string, milestone: string) => Promise<void>;
  onViewBrief: (brief: AdminBrief) => void;
  onCreateProposalFromBrief?: (brief: AdminBrief) => void;
  busy: string | null;
  money: (cents: number, currency: string) => string;
  date: (value: string | null) => string;
}

export function AdminProjectsView({
  orders,
  filterTab,
  setFilterTab,
  searchQuery,
  setSearchQuery,
  onSendInvoice,
  onUpdateMilestone,
  onViewBrief,
  onCreateProposalFromBrief,
  busy,
  money,
  date,
}: AdminProjectsViewProps) {
  const [updatingMilestone, setUpdatingMilestone] = useState<string | null>(null);

  const filteredOrders = orders.filter((o) => {
    if (filterTab === "PENDING_BALANCE" && o.balance_status !== "pending") return false;
    if (filterTab === "PAID_IN_FULL" && (o.balance_status !== "paid" || o.is_deposit === false))
      return false;
    if (filterTab === "RETAINERS" && !o.stripe_subscription_id) return false;
    if (filterTab === "REFUNDED" && o.amount_refunded <= 0) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (o.customer_name ?? "").toLowerCase().includes(q) ||
      (o.customer_email ?? "").toLowerCase().includes(q) ||
      (o.stripe_session_id ?? "").toLowerCase().includes(q) ||
      (o.product_name ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "ALL", label: "ALL COMMISSIONS" },
              { id: "PENDING_BALANCE", label: "PENDING BALANCE" },
              { id: "PAID_IN_FULL", label: "PAID IN FULL" },
              { id: "RETAINERS", label: "RETAINERS" },
              { id: "REFUNDED", label: "REFUNDED" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-3 py-1.5 font-mono text-[10px] tracking-widest transition-colors ${
                filterTab === tab.id
                  ? "bg-[#FF3333] font-bold text-black"
                  : "border border-white/10 text-white/60 hover:border-white/30 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full max-w-xs sm:w-auto">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search clients, emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-white/10 bg-white/[0.02] py-1.5 pl-9 pr-3 font-mono text-xs text-white placeholder:text-white/30 focus:border-[#FF3333] focus:outline-none"
          />
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="border border-dashed border-white/10 py-16 text-center">
          <Briefcase className="mx-auto size-8 text-white/20" />
          <p className="mt-3 font-mono text-xs text-white/40">No commissions matching this view.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isDepositPending = order.is_deposit && order.balance_status === "pending";
            const currentMilestone = order.brief?.project_status ?? "brief_received";

            return (
              <div
                key={order.id}
                className="border border-white/10 bg-white/[0.01] p-5 transition-colors hover:border-white/20"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-xl uppercase tracking-wide text-white">
                        {order.customer_name || "Client"}
                      </span>
                      {order.is_deposit && (
                        <span className="border border-[#FF3333]/40 bg-[#FF3333]/10 px-2 py-0.5 font-mono text-[9px] tracking-widest text-[#FF3333]">
                          50% DEPOSIT
                        </span>
                      )}
                      {order.stripe_subscription_id && (
                        <span className="border border-blue-500/40 bg-blue-500/10 px-2 py-0.5 font-mono text-[9px] tracking-widest text-blue-400">
                          RETAINER
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-mono text-xs text-white/60">
                      {order.customer_email} · {date(order.created_at)}
                    </p>
                    <p className="mt-2 font-mono text-xs font-semibold text-white/90">
                      {order.product_name || "Custom Commission"}
                    </p>
                  </div>

                  {/* Financial Details Badge */}
                  <div className="text-right font-mono text-xs">
                    <div className="text-white">
                      Paid:{" "}
                      <span className="font-bold text-[#FF3333]">
                        {money(order.amount_total, order.currency)}
                      </span>
                    </div>
                    {order.is_deposit && (
                      <div className="mt-1 text-white/60">
                        Balance:{" "}
                        <span
                          className={
                            order.balance_status === "paid"
                              ? "text-emerald-400"
                              : order.balance_status === "pending"
                                ? "text-amber-400 font-bold"
                                : "text-white/40"
                          }
                        >
                          {money(order.balance_due_cents, order.currency)} (
                          {order.balance_status.toUpperCase()})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Milestone & Actions Bar */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
                  {/* Milestone Select */}
                  <div className="flex items-center gap-2">
                    <Clock className="size-3.5 text-white/40" />
                    <span className="font-mono text-[10px] text-white/50">MILESTONE:</span>
                    <select
                      value={currentMilestone}
                      disabled={updatingMilestone === order.id}
                      onChange={async (e) => {
                        setUpdatingMilestone(order.id);
                        try {
                          await onUpdateMilestone(order.id, e.target.value);
                          toast.success("Milestone updated");
                        } catch {
                          toast.error("Failed to update milestone");
                        } finally {
                          setUpdatingMilestone(null);
                        }
                      }}
                      className="border border-white/15 bg-[#030014] px-2.5 py-1 font-mono text-xs text-white focus:border-[#FF3333] focus:outline-none"
                    >
                      {MILESTONES.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {order.brief && (
                      <button
                        onClick={() => onViewBrief(order.brief!)}
                        className="inline-flex items-center gap-1.5 border border-white/15 px-3 py-1.5 font-mono text-[10px] tracking-widest text-white/80 transition-colors hover:border-white hover:text-white"
                      >
                        <FileText className="size-3 text-[#FF3333]" />
                        VIEW BRIEF
                      </button>
                    )}

                    {onCreateProposalFromBrief && order.brief && (
                      <button
                        onClick={() => onCreateProposalFromBrief(order.brief!)}
                        className="inline-flex items-center gap-1.5 border border-white/15 px-3 py-1.5 font-mono text-[10px] tracking-widest text-white/80 transition-colors hover:border-[#FF3333] hover:text-white"
                      >
                        <Plus className="size-3 text-[#FF3333]" />
                        NEW PROPOSAL
                      </button>
                    )}

                    {isDepositPending && (
                      <button
                        disabled={busy === order.id}
                        onClick={() => onSendInvoice(order.id)}
                        className="inline-flex items-center gap-1.5 bg-[#FF3333] px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest text-black transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        <Mail className="size-3" />
                        {busy === order.id ? "SENDING..." : "INVOICE BALANCE (50%)"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
