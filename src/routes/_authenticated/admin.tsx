import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { getStripeEnvironment } from "@/lib/stripe";
import { adminListOrders, adminSendBalanceInvoice } from "@/utils/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Studio Admin — theroyeffect.com" },
      {
        name: "description",
        content: "Private studio admin for commissions, deposit balances and billing.",
      },
      { property: "og:title", content: "Studio Admin — theroyeffect.com" },
      { property: "og:description", content: "Private studio admin." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(
    cents / 100,
  );

function AdminPage() {
  const environment = getStripeEnvironment();
  const queryClient = useQueryClient();
  const list = useServerFn(adminListOrders);
  const sendInvoice = useServerFn(adminSendBalanceInvoice);
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-orders", environment],
    queryFn: () => list({ data: { environment } }),
    retry: false,
  });

  const invoiceBalance = async (orderId: string) => {
    setBusy(orderId);
    try {
      const result = await sendInvoice({ data: { orderId, environment } });
      if ("error" in result) throw new Error(result.error);
      toast.success("Balance invoice sent");
      await queryClient.invalidateQueries({ queryKey: ["admin-orders", environment] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send invoice");
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#030014] px-5 py-16 md:px-10">
      <Toaster />
      <div className="mx-auto max-w-6xl">
        <span className="font-mono text-[10px] tracking-widest text-[#FF3333]">STUDIO ADMIN</span>
        <h1 className="mt-3 font-display text-5xl uppercase leading-[0.9] text-white">COMMISSIONS</h1>
        <Link
          to="/account"
          className="mt-4 inline-block font-mono text-[11px] tracking-widest text-white/40 hover:text-white"
        >
          ← BACK TO ACCOUNT
        </Link>

        {isLoading && <p className="mt-10 font-mono text-xs text-white/40">Loading…</p>}
        {error && (
          <p className="mt-10 font-mono text-xs text-amber-300">
            You don’t have admin access on this account.
          </p>
        )}

        <div className="mt-10 space-y-3">
          {data?.orders.map((order) => (
            <div
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-4 border border-white/10 bg-white/[0.02] p-5"
            >
              <div>
                <p className="font-display text-lg uppercase text-white">{order.product_name}</p>
                <p className="mt-1 font-mono text-[11px] text-white/40">
                  {order.customer_email ?? "no email"} ·{" "}
                  {money(order.amount_total, order.currency)} · {order.payment_status}
                  {order.amount_refunded > 0
                    ? ` · refunded ${money(order.amount_refunded, order.currency)}`
                    : ""}
                </p>
              </div>
              {order.balance_due_cents > 0 && (
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-white/50">
                    balance {money(order.balance_due_cents, order.currency)} ·{" "}
                    {order.balance_status}
                  </span>
                  {order.balance_status === "pending" ? (
                    <button
                      type="button"
                      onClick={() => invoiceBalance(order.id)}
                      disabled={busy === order.id}
                      className="bg-[#FF3333] px-4 py-2 font-mono text-[11px] tracking-widest text-black disabled:opacity-50"
                    >
                      {busy === order.id ? "SENDING…" : "INVOICE BALANCE"}
                    </button>
                  ) : (
                    order.balance_invoice_url && (
                      <a
                        href={order.balance_invoice_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[11px] tracking-widest text-[#FF3333] underline"
                      >
                        VIEW INVOICE
                      </a>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
