import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Loader2,
  LogOut,
} from "lucide-react";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@/components/Logo";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import {
  confirmBalancePayment,
  createBalanceCheckoutSession,
} from "@/utils/payments.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  getMyPortal,
  type PortalInvoice,
  type PortalProject,
} from "@/utils/portal.functions";

export const Route = createFileRoute("/_authenticated/portal")({
  head: () => ({
    meta: [
      { title: "Client Dashboard — theroyeffect.com" },
      {
        name: "description",
        content:
          "Your private client dashboard: project timelines, milestones, deliverables and invoices.",
      },
      { property: "og:title", content: "Client Dashboard — theroyeffect.com" },
      {
        property: "og:description",
        content: "Project timelines, milestones, deliverables and invoices.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PortalPage,
});

const STATUS_LABELS: Record<string, string> = {
  onboarding: "ONBOARDING",
  in_progress: "IN PROGRESS",
  in_review: "IN REVIEW",
  delivered: "DELIVERED",
  complete: "COMPLETE",
};

const date = (value: string | null) =>
  value
    ? new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(
    cents / 100,
  );

function StatusPill({ status }: { status: string }) {
  const done = status === "complete" || status === "delivered";
  return (
    <span
      className={`border px-3 py-1 font-mono text-[10px] tracking-widest ${
        done
          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
          : "border-[#FF3333]/50 bg-[#FF3333]/10 text-[#FF3333]"
      }`}
    >
      {STATUS_LABELS[status] ?? status.toUpperCase()}
    </span>
  );
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="h-1.5 w-full bg-white/10">
        <div className="h-full bg-[#FF3333] transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 font-mono text-[10px] tracking-widest text-white/40">
        {pct}% COMPLETE · {done}/{total} MILESTONES
      </p>
    </div>
  );
}

function ProjectSummary({ project }: { project: PortalProject }) {
  const done = project.milestones.filter((m) => m.status === "done").length;
  const active = project.milestones.find((m) => m.status === "active");

  return (
    <section className="border border-white/10 bg-white/[0.02] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl uppercase leading-tight text-white">
            {project.title}
          </h2>
          <p className="mt-1 font-mono text-[11px] text-white/40">
            {project.start_date ? `Started ${date(project.start_date)}` : `Started ${date(project.created_at)}`}
            {project.target_date ? ` · Target delivery ${date(project.target_date)}` : ""}
          </p>
        </div>
        <StatusPill status={project.status} />
      </div>

      {project.summary && (
        <p className="mt-4 font-mono text-xs leading-relaxed text-white/60">{project.summary}</p>
      )}

      <div className="mt-5">
        <ProgressBar done={done} total={project.milestones.length} />
      </div>

      {(project.next_step || active) && (
        <div className="mt-5 border-l-2 border-[#FF3333] bg-[#FF3333]/5 px-4 py-3">
          <p className="font-mono text-[10px] tracking-widest text-[#FF3333]">UP NEXT</p>
          <p className="mt-1 font-mono text-xs text-white/80">
            {project.next_step || active?.title}
          </p>
        </div>
      )}
    </section>
  );
}

function Timeline({ project }: { project: PortalProject }) {
  if (project.milestones.length === 0) {
    return (
      <p className="font-mono text-xs text-white/40">
        Milestones will appear here as the project kicks off.
      </p>
    );
  }

  return (
    <ol className="relative space-y-6 border-l border-white/10 pl-6">
      {project.milestones.map((m) => (
        <li key={m.id} className="relative">
          <span className="absolute -left-[31px] top-0.5 flex size-5 items-center justify-center rounded-full bg-[#030014]">
            {m.status === "done" ? (
              <CheckCircle2 className="size-4 text-emerald-400" />
            ) : m.status === "active" ? (
              <Loader2 className="size-4 animate-spin text-[#FF3333]" />
            ) : (
              <Circle className="size-4 text-white/25" />
            )}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`font-display text-sm uppercase ${
                m.status === "pending" ? "text-white/40" : "text-white"
              }`}
            >
              {m.title}
            </span>
            {m.status === "active" && (
              <span className="bg-[#FF3333] px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-black">
                IN PROGRESS
              </span>
            )}
            {m.due_date && m.status !== "done" && (
              <span className="font-mono text-[10px] tracking-widest text-white/40">
                DUE {date(m.due_date).toUpperCase()}
              </span>
            )}
            {m.completed_at && m.status === "done" && (
              <span className="font-mono text-[10px] tracking-widest text-emerald-400/70">
                DONE {date(m.completed_at).toUpperCase()}
              </span>
            )}
          </div>
          {m.note && <p className="mt-1 font-mono text-xs text-white/50">{m.note}</p>}
          {m.link && (
            <a
              href={m.link}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 border border-[#FF3333]/40 bg-[#FF3333]/10 px-3 py-1.5 font-mono text-[11px] tracking-widest text-[#FF3333] transition-colors hover:bg-[#FF3333] hover:text-black"
            >
              VIEW DELIVERABLE <ExternalLink className="size-3" />
            </a>
          )}
        </li>
      ))}
    </ol>
  );
}

function Invoices({
  invoices,
  onPayBalance,
}: {
  invoices: PortalInvoice[];
  onPayBalance: (orderId: string) => void;
}) {
  if (invoices.length === 0) {
    return (
      <p className="font-mono text-xs text-white/40">
        No invoices yet. Payments and receipts will show up here automatically.
      </p>
    );
  }

  const totalPaid = invoices.reduce((sum, i) => sum + i.amount_cents, 0);
  const outstanding = invoices.reduce((sum, i) => sum + i.balance_due_cents, 0);
  const currency = invoices[0]?.currency ?? "usd";

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border border-white/10 bg-white/[0.02] p-5">
          <p className="font-mono text-[10px] tracking-widest text-white/40">TOTAL PAID</p>
          <p className="mt-2 font-display text-3xl text-white">{money(totalPaid, currency)}</p>
        </div>
        <div className="border border-white/10 bg-white/[0.02] p-5">
          <p className="font-mono text-[10px] tracking-widest text-white/40">BALANCE DUE</p>
          <p
            className={`mt-2 font-display text-3xl ${
              outstanding > 0 ? "text-[#FF3333]" : "text-emerald-400"
            }`}
          >
            {money(outstanding, currency)}
          </p>
        </div>
      </div>

      <div className="divide-y divide-white/10 border border-white/10">
        {invoices.map((inv) => (
          <div key={`${inv.kind}-${inv.id}`} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm uppercase text-white">{inv.description}</p>
              <p className="mt-1 font-mono text-[11px] text-white/40">
                {date(inv.issued_at)} · {inv.kind === "retainer" ? "RETAINER" : "COMMISSION"} ·{" "}
                {inv.status.replace(/_/g, " ").toUpperCase()}
                {inv.balance_due_cents > 0
                  ? ` · ${money(inv.balance_due_cents, inv.currency)} REMAINING`
                  : ""}
              </p>
            </div>
            <span className="font-mono text-sm text-white">
              {money(inv.amount_cents, inv.currency)}
            </span>
            {inv.kind === "commission" && inv.balance_due_cents > 0 && (
              <button
                type="button"
                onClick={() => onPayBalance(inv.id)}
                className="inline-flex items-center gap-1.5 border border-[#FF3333] bg-[#FF3333]/10 px-3 py-1.5 font-mono text-[10px] tracking-widest text-[#FF3333] transition-colors hover:bg-[#FF3333] hover:text-black"
              >
                PAY {money(inv.balance_due_cents, inv.currency)}
              </button>
            )}
            {inv.hosted_url && (
              <a
                href={inv.hosted_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 border border-white/20 px-3 py-1.5 font-mono text-[10px] tracking-widest text-white/70 transition-colors hover:border-[#FF3333] hover:text-[#FF3333]"
              >
                RECEIPT <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

type Tab = "overview" | "timeline" | "invoices";

const TABS: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "OVERVIEW", icon: LayoutDashboard },
  { key: "timeline", label: "TIMELINE", icon: CalendarDays },
  { key: "invoices", label: "INVOICES", icon: FileText },
];

function PortalPage() {
  const fetchPortal = useServerFn(getMyPortal);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const startBalanceCheckout = useServerFn(createBalanceCheckoutSession);
  const confirmBalance = useServerFn(confirmBalancePayment);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["client-portal"],
    queryFn: () => fetchPortal(),
  });

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    if (!payingOrderId) throw new Error("No invoice selected");
    const res = await startBalanceCheckout({
      data: {
        orderId: payingOrderId,
        returnUrl: `${window.location.origin}/portal?balance_session={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
      },
    });
    if ("error" in res) throw new Error(res.error);
    if (!res.clientSecret) throw new Error("Checkout could not be started");
    return res.clientSecret;
  }, [payingOrderId, startBalanceCheckout]);

  // Confirm settlement when Stripe returns the client to the portal.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("balance_session");
    if (!sessionId) return;
    window.history.replaceState({}, "", "/portal");
    void (async () => {
      const res = await confirmBalance({
        data: { sessionId, environment: getStripeEnvironment() },
      });
      if (res.paid) {
        toast.success("Balance paid — thank you!");
        await refetch();
      } else if (res.error) {
        toast.error(res.error);
      } else {
        toast.message("Payment is processing. We'll update your invoice once it settles.");
      }
      setTab("invoices");
    })();
  }, [confirmBalance, refetch]);

  const projects = data?.projects ?? [];
  const invoices = data?.invoices ?? [];
  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? projects[0] ?? null,
    [projects, activeProjectId],
  );

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/portal/login", replace: true });
  };

  if (payingOrderId) {
    return (
      <main className="min-h-screen bg-[#030014] px-5 py-16 md:px-10">
        <Toaster />
        <div className="mx-auto max-w-3xl">
          <Logo variant="compact" size="md" href="/" className="mb-6" />
          <div className="mb-6 flex items-center justify-between gap-4">
            <h1 className="font-display text-2xl uppercase text-white">PAY REMAINING BALANCE</h1>
            <button
              type="button"
              onClick={() => setPayingOrderId(null)}
              className="border border-white/20 px-3 py-1.5 font-mono text-[10px] tracking-widest text-white/70 hover:border-white/50"
            >
              CANCEL
            </button>
          </div>
          <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-[#030014] px-5 py-16 md:px-10">
      <Toaster />
      <div className="mx-auto max-w-5xl">
        <Logo variant="compact" size="md" href="/" className="mb-6" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] tracking-widest text-[#FF3333]">
              CLIENT DASHBOARD
            </span>
            <h1 className="mt-3 font-display text-3xl uppercase leading-[0.9] text-white sm:text-5xl">
              YOUR PROJECTS
            </h1>
            <p className="mt-2 font-mono text-xs text-white/40">
              {data?.email ? `Signed in as ${data.email}` : "Live status, timeline and invoices."}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/"
              className="border border-white/15 px-4 py-2.5 font-mono text-[11px] tracking-widest text-white/60 transition-colors hover:text-white"
            >
              BACK TO SITE
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex items-center gap-2 border border-white/15 px-4 py-2.5 font-mono text-[11px] tracking-widest text-white transition-colors hover:border-[#FF3333] hover:text-[#FF3333]"
            >
              <LogOut className="size-3" /> SIGN OUT
            </button>
          </div>
        </div>

        {isLoading && (
          <p className="mt-12 font-mono text-xs text-white/40">Loading your dashboard…</p>
        )}

        {isError && (
          <div className="mt-12 border border-[#FF3333]/40 bg-[#FF3333]/5 p-6">
            <p className="font-mono text-xs tracking-widest text-[#FF3333]">
              COULDN&apos;T LOAD YOUR DASHBOARD
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-4 border border-white/20 px-4 py-2 font-mono text-[11px] tracking-widest text-white/80 transition-colors hover:border-white/50 hover:text-white"
            >
              TRY AGAIN
            </button>
          </div>
        )}

        {data && (
          <>
            <nav className="mt-10 flex flex-wrap gap-2 border-b border-white/10 pb-3">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`inline-flex items-center gap-2 px-4 py-2 font-mono text-[11px] tracking-widest transition-colors ${
                    tab === key
                      ? "bg-[#FF3333] text-black"
                      : "border border-white/15 text-white/60 hover:text-white"
                  }`}
                >
                  <Icon className="size-3" /> {label}
                </button>
              ))}
            </nav>

            {projects.length > 1 && tab !== "invoices" && (
              <div className="mt-6 flex flex-wrap gap-2">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActiveProjectId(p.id)}
                    className={`border px-3 py-2 font-mono text-[10px] tracking-widest transition-colors ${
                      activeProject?.id === p.id
                        ? "border-[#FF3333] text-[#FF3333]"
                        : "border-white/10 text-white/50 hover:text-white"
                    }`}
                  >
                    {p.title.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-8 space-y-8">
              {tab === "overview" &&
                (projects.length === 0 ? (
                  <div className="border border-dashed border-white/10 py-16 text-center">
                    <p className="font-mono text-xs text-white/50">
                      No projects in your dashboard yet. Once your commission kicks off, live
                      milestones and deliverables show up here.
                    </p>
                    <Link
                      to="/book"
                      className="mt-6 inline-block bg-[#FF3333] px-5 py-2.5 font-mono text-xs tracking-widest text-black transition-opacity hover:opacity-90"
                    >
                      BOOK A DISCOVERY CALL →
                    </Link>
                  </div>
                ) : (
                  projects.map((p) => <ProjectSummary key={p.id} project={p} />)
                ))}

              {tab === "timeline" &&
                (activeProject ? (
                  <section className="border border-white/10 bg-white/[0.02] p-6">
                    <h2 className="mb-6 font-display text-xl uppercase text-white">
                      {activeProject.title}
                    </h2>
                    <Timeline project={activeProject} />
                  </section>
                ) : (
                  <p className="font-mono text-xs text-white/40">No timeline yet.</p>
                ))}

              {tab === "invoices" && (
                <Invoices invoices={invoices} onPayBalance={setPayingOrderId} />
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
