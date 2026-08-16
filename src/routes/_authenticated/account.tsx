import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/useAuth";
import { getStripeEnvironment } from "@/lib/stripe";
import { Logo } from "@/components/Logo";
import {
  claimCheckoutSession,
  createPortalSession,
  getMyAccount,
} from "@/utils/account.functions";

export const Route = createFileRoute("/_authenticated/account")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } =>
    typeof search["session_id"] === "string" ? { session_id: search["session_id"] } : {},
  head: () => ({
    meta: [
      { title: "Your Account — theroyeffect.com" },
      {
        name: "description",
        content:
          "Your theroyeffect client account: commissions, deposit balances, project briefs, invoices and retainer billing.",
      },
      { property: "og:title", content: "Your Account — theroyeffect.com" },
      {
        property: "og:description",
        content: "Commissions, balances, briefs, invoices and retainer billing in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(
    cents / 100,
  );

const date = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

function AccountPage() {
  const { session_id: sessionId } = Route.useSearch();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const environment = getStripeEnvironment();

  const fetchAccount = useServerFn(getMyAccount);
  const claim = useServerFn(claimCheckoutSession);
  const portal = useServerFn(createPortalSession);
  const [portalBusy, setPortalBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["account", environment],
    queryFn: () => fetchAccount({ data: { environment } }),
  });

  useEffect(() => {
    if (!sessionId || !user) return;
    void claim({ data: { sessionId, environment } })
      .then(() => queryClient.invalidateQueries({ queryKey: ["account", environment] }))
      .catch(() => {});
  }, [sessionId, user, claim, environment, queryClient]);

  const openPortal = async () => {
    setPortalBusy(true);
    try {
      const result = await portal({
        data: { returnUrl: `${window.location.origin}/account`, environment },
      });
      if ("error" in result) throw new Error(result.error);
      window.open(result.url, "_blank", "noopener");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open billing portal");
    } finally {
      setPortalBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#030014] px-5 py-16 md:px-10">
      <Toaster />
      <div className="mx-auto max-w-5xl">
        <Logo variant="compact" size="md" href="/" className="mb-6" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] tracking-widest text-[#FF3333]">CLIENT ACCOUNT</span>
            <h1 className="mt-3 font-display text-5xl uppercase leading-[0.9] text-white md:text-6xl">
              {data?.fullName ? data.fullName.split(" ")[0] : "YOUR"} DASHBOARD
            </h1>
            <p className="mt-2 font-mono text-xs text-white/40">{data?.email ?? user?.email}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/"
              className="border border-white/15 px-4 py-2.5 font-mono text-[11px] tracking-widest text-white transition-colors hover:border-[#FF3333] hover:text-[#FF3333]"
            >
              BACK TO SITE
            </Link>
            <button
              type="button"
              onClick={openPortal}
              disabled={portalBusy}
              className="bg-[#FF3333] px-4 py-2.5 font-mono text-[11px] tracking-widest text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {portalBusy ? "OPENING…" : "MANAGE BILLING"}
            </button>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                queryClient.clear();
                void navigate({ to: "/auth" });
              }}
              className="border border-white/15 px-4 py-2.5 font-mono text-[11px] tracking-widest text-white/60 transition-colors hover:text-white"
            >
              SIGN OUT
            </button>
          </div>
        </div>

        {data?.isAdmin && (
          <Link
            to="/admin"
            className="mt-6 inline-block border border-[#FF3333]/50 px-4 py-2 font-mono text-[11px] tracking-widest text-[#FF3333]"
          >
            OPEN STUDIO ADMIN →
          </Link>
        )}

        {isLoading && (
          <p className="mt-12 font-mono text-xs text-white/40">Loading your account…</p>
        )}

        {data && (
          <div className="mt-12 space-y-12">
            {/* Active Project Milestone Tracker */}
            {(data.orders.length > 0 || data.briefs.length > 0) && (() => {
              const latestBrief = data.briefs[0];
              const stageMap: Record<string, number> = {
                brief_received: 2,
                direction_locked: 3,
                design_build: 4,
                in_review: 4,
                completed: 5,
              };
              const activeStage = latestBrief?.project_status
                ? stageMap[latestBrief.project_status] ?? 2
                : data.orders.length > 0
                  ? 1
                  : 0;
              const isFullyDone = latestBrief?.project_status === "completed";

              const steps = [
                { label: "1. Deposit Reserved" },
                { label: "2. Brief Submitted" },
                { label: "3. Scope & Direction" },
                { label: "4. Design & Build" },
                { label: "5. Final & Launch" },
              ];

              return (
                <section className="border border-white/10 bg-white/[0.02] p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs tracking-widest text-[#FF3333]">
                      PROJECT WORKFLOW STATUS
                    </span>
                    <span className="font-mono text-[11px] text-white/40">
                      {isFullyDone
                        ? "Project Complete & Delivered"
                        : latestBrief
                          ? `Stage ${activeStage} of 5 in Progress`
                          : "Awaiting Project Brief"}
                    </span>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {steps.map((step, idx) => {
                      const stepNumber = idx + 1;
                      const isDone = isFullyDone || stepNumber < activeStage || (stepNumber === 1 && data.orders.length > 0 && activeStage > 1);
                      const isCurrent = !isFullyDone && stepNumber === activeStage;

                      return (
                        <div
                          key={step.label}
                          className={`flex flex-col border p-3 ${
                            isDone
                              ? "border-[#FF3333] bg-[#FF3333]/10 text-white"
                              : isCurrent
                                ? "border-white/40 bg-white/[0.04] text-white"
                                : "border-white/10 text-white/30"
                          }`}
                        >
                          <span className="font-mono text-[10px] tracking-widest text-[#FF3333]">
                            {isDone ? "✓ COMPLETE" : isCurrent ? "▶ ACTIVE" : "QUEUED"}
                          </span>
                          <span className="mt-1 font-display text-xs uppercase">{step.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {(latestBrief?.project_links || latestBrief?.project_notes) && (
                    <div className="mt-6 border-t border-white/10 pt-4 space-y-3">
                      {latestBrief.project_notes && (
                        <div>
                          <span className="font-mono text-[10px] uppercase tracking-widest text-[#FF3333]">
                            STUDIO DIRECTION NOTE
                          </span>
                          <p className="mt-1 font-mono text-xs text-white/80 whitespace-pre-wrap leading-relaxed">
                            {latestBrief.project_notes}
                          </p>
                        </div>
                      )}
                      {latestBrief.project_links && (
                        <div>
                          <span className="font-mono text-[10px] uppercase tracking-widest text-[#FF3333]">
                            PROTOTYPE &amp; STAGING LINKS
                          </span>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {latestBrief.project_links.split("\n").filter(Boolean).map((linkStr, i) => {
                              const trimmed = linkStr.trim();
                              const isUrl = /^https?:\/\//i.test(trimmed);
                              return isUrl ? (
                                <a
                                  key={i}
                                  href={trimmed}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 border border-[#FF3333]/40 bg-[#FF3333]/10 px-3 py-1.5 font-mono text-xs text-[#FF3333] transition-colors hover:bg-[#FF3333] hover:text-black"
                                >
                                  {trimmed} ↗
                                </a>
                              ) : (
                                <span key={i} className="font-mono text-xs text-white/70">
                                  {trimmed}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              );
            })()}

            <Section title="PROJECT BRIEFS">
              {data.briefs.length === 0 ? (
                <div className="border border-white/10 bg-white/[0.02] p-6 text-center">
                  <p className="font-mono text-xs text-white/50">
                    No project brief submitted for your commission yet.
                  </p>
                  <Link
                    to="/brief"
                    className="mt-4 inline-flex items-center gap-2 bg-[#FF3333] px-5 py-2.5 font-mono text-xs tracking-widest text-black transition-opacity hover:opacity-90"
                  >
                    START YOUR PROJECT BRIEF →
                  </Link>
                </div>
              ) : (
                data.briefs.map((brief) => (
                  <Row key={brief.id}>
                    <div>
                      <p className="font-display text-lg uppercase text-white">{brief.project_type}</p>
                      {brief.goals && (
                        <p className="mt-1 max-w-md font-mono text-xs text-white/50 line-clamp-1">
                          {brief.goals}
                        </p>
                      )}
                      <span className="mt-2 block font-mono text-[11px] text-white/40">
                        Submitted {date(brief.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {brief.pdf_url ? (
                        <a
                          href={brief.pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="border border-[#FF3333]/40 bg-[#FF3333]/10 px-4 py-2 font-mono text-[11px] tracking-widest text-[#FF3333] transition-colors hover:bg-[#FF3333] hover:text-black"
                        >
                          DOWNLOAD BRIEF PDF ↓
                        </a>
                      ) : (
                        <Badge tone="good">SUBMITTED</Badge>
                      )}
                    </div>
                  </Row>
                ))
              )}
            </Section>

            <Section title="RETAINERS">
              {data.subscriptions.length === 0 ? (
                <Empty>No active retainer. Start one from the pricing section.</Empty>
              ) : (
                data.subscriptions.map((sub) => (
                  <Row key={sub.id}>
                    <div>
                      <p className="font-display text-lg uppercase text-white">{sub.product_name}</p>
                      <p className="mt-1 font-mono text-[11px] text-white/40">
                        {sub.cancel_at_period_end
                          ? `Ends ${date(sub.current_period_end)}`
                          : `Renews ${date(sub.current_period_end)}`}
                        {sub.latest_invoice_status ? ` · last invoice ${sub.latest_invoice_status}` : ""}
                      </p>
                    </div>
                    <Badge
                      tone={
                        sub.status === "active" || sub.status === "trialing"
                          ? "good"
                          : sub.status === "past_due" || sub.status === "unpaid"
                            ? "warn"
                            : "muted"
                      }
                    >
                      {sub.status.toUpperCase()}
                    </Badge>
                  </Row>
                ))
              )}
            </Section>

            <Section title="COMMISSIONS">
              {data.orders.length === 0 ? (
                <Empty>No purchases on this account yet.</Empty>
              ) : (
                data.orders.map((order) => (
                  <Row key={order.id}>
                    <div>
                      <p className="font-display text-lg uppercase text-white">{order.product_name}</p>
                      <p className="mt-1 font-mono text-[11px] text-white/40">
                        {date(order.created_at)} · {money(order.amount_total, order.currency)}
                        {order.amount_refunded > 0
                          ? ` · refunded ${money(order.amount_refunded, order.currency)}`
                          : ""}
                      </p>
                      {order.balance_status === "invoiced" && order.balance_invoice_url && (
                        <a
                          href={order.balance_invoice_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block font-mono text-[11px] tracking-widest text-[#FF3333] underline"
                        >
                          PAY REMAINING {money(order.balance_due_cents, order.currency)} →
                        </a>
                      )}
                      {order.balance_status === "pending" && (
                        <p className="mt-2 font-mono text-[11px] text-white/40">
                          Remaining balance {money(order.balance_due_cents, order.currency)} — invoiced
                          at project completion.
                        </p>
                      )}
                    </div>
                    <Badge tone={order.payment_status === "paid" ? "good" : "warn"}>
                      {order.payment_status.toUpperCase()}
                    </Badge>
                  </Row>
                ))
              )}
            </Section>

            <Section title="INVOICES">
              {data.invoices.length === 0 ? (
                <Empty>No subscription invoices yet.</Empty>
              ) : (
                data.invoices.map((inv) => (
                  <Row key={inv.id}>
                    <div>
                      <p className="font-mono text-sm text-white">
                        {inv.description ?? "Retainer invoice"}
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-white/40">
                        {date(inv.created_at)} ·{" "}
                        {money(inv.amount_paid || inv.amount_due, inv.currency)}
                        {inv.billing_reason ? ` · ${inv.billing_reason.replace(/_/g, " ")}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={inv.status === "paid" ? "good" : "warn"}>
                        {inv.status.toUpperCase()}
                      </Badge>
                      {inv.hosted_invoice_url && (
                        <a
                          href={inv.hosted_invoice_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[11px] tracking-widest text-[#FF3333] underline"
                        >
                          VIEW
                        </a>
                      )}
                    </div>
                  </Row>
                ))
              )}
            </Section>
          </div>
        )}
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-mono text-xs tracking-widest text-[#FF3333]">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border border-white/10 bg-white/[0.02] p-5">
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-xs text-white/40">{children}</p>;
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "good" | "warn" | "muted" }) {
  const cls =
    tone === "good"
      ? "border-[#FF3333]/60 text-[#FF3333]"
      : tone === "warn"
        ? "border-amber-400/60 text-amber-300"
        : "border-white/20 text-white/50";
  return (
    <span className={`border px-3 py-1 font-mono text-[10px] tracking-widest ${cls}`}>
      {children}
    </span>
  );
}
