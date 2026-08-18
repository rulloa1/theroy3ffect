import { DollarSign } from "lucide-react";
import type { AdminOrder } from "@/utils/admin.functions";

export interface AdminFinancialsViewProps {
  orders: AdminOrder[];
  money: (cents: number, currency: string) => string;
  date: (value: string | null) => string;
}

export function AdminFinancialsView({ orders, money, date }: AdminFinancialsViewProps) {
  const totalRevenueCents = orders.reduce((sum, o) => sum + (o.amount_total || 0), 0);
  const pendingBalanceCents = orders
    .filter((o) => o.balance_status === "pending")
    .reduce((sum, o) => sum + (o.balance_due_cents || 0), 0);
  const totalRefundedCents = orders.reduce((sum, o) => sum + (o.amount_refunded || 0), 0);
  const depositOrdersCount = orders.filter((o) => o.is_deposit).length;
  const retainerCount = orders.filter((o) => o.stripe_subscription_id).length;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="border border-white/10 bg-white/[0.01] p-5">
          <span className="font-mono text-[10px] tracking-widest text-white/40">
            GROSS COLLECTED
          </span>
          <div className="mt-2 font-display text-3xl text-[#FF3333]">
            {money(totalRevenueCents, "usd")}
          </div>
          <p className="mt-1 font-mono text-[10px] text-white/50">
            Across {orders.length} transactions
          </p>
        </div>

        <div className="border border-white/10 bg-white/[0.01] p-5">
          <span className="font-mono text-[10px] tracking-widest text-white/40">
            OUTSTANDING BALANCES
          </span>
          <div className="mt-2 font-display text-3xl text-amber-400">
            {money(pendingBalanceCents, "usd")}
          </div>
          <p className="mt-1 font-mono text-[10px] text-white/50">From 50% deposit commissions</p>
        </div>

        <div className="border border-white/10 bg-white/[0.01] p-5">
          <span className="font-mono text-[10px] tracking-widest text-white/40">
            ACTIVE RETAINERS
          </span>
          <div className="mt-2 font-display text-3xl text-blue-400">{retainerCount}</div>
          <p className="mt-1 font-mono text-[10px] text-white/50">Recurring design subscriptions</p>
        </div>

        <div className="border border-white/10 bg-white/[0.01] p-5">
          <span className="font-mono text-[10px] tracking-widest text-white/40">
            DEPOSIT COMMISSIONS
          </span>
          <div className="mt-2 font-display text-3xl text-white">{depositOrdersCount}</div>
          <p className="mt-1 font-mono text-[10px] text-white/50">Split payment model</p>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="border border-white/10 bg-white/[0.01] p-5">
        <h3 className="font-display text-lg uppercase text-white">Transaction Breakdown</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] tracking-widest text-white/40">
                <th className="pb-3">CLIENT</th>
                <th className="pb-3">PRODUCT</th>
                <th className="pb-3">TYPE</th>
                <th className="pb-3 text-right">PAID</th>
                <th className="pb-3 text-right">BALANCE STATUS</th>
                <th className="pb-3 text-right">DATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.map((o) => (
                <tr key={o.id} className="text-white/80 hover:bg-white/[0.02]">
                  <td className="py-3 font-semibold text-white">
                    {o.customer_name || o.customer_email || "Client"}
                  </td>
                  <td className="py-3 text-white/60">{o.product_name || "Commission"}</td>
                  <td className="py-3">
                    {o.is_deposit ? (
                      <span className="text-[#FF3333]">Deposit</span>
                    ) : o.stripe_subscription_id ? (
                      <span className="text-blue-400">Retainer</span>
                    ) : (
                      "Full Pay"
                    )}
                  </td>
                  <td className="py-3 text-right font-bold text-white">
                    {money(o.amount_total, o.currency)}
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className={
                        o.balance_status === "paid"
                          ? "text-emerald-400"
                          : o.balance_status === "pending"
                            ? "text-amber-400"
                            : "text-white/40"
                      }
                    >
                      {o.is_deposit ? o.balance_status.toUpperCase() : "N/A"}
                    </span>
                  </td>
                  <td className="py-3 text-right text-white/50">{date(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
