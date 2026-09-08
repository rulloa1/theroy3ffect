import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { getMyPortal, type PortalMilestone, type PortalProject } from "@/utils/portal.functions";
import { getMyProposals, type ProjectProposal } from "@/utils/proposals.functions";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project Details — theroyeffect.com" },
      {
        name: "description",
        content: "Your project details, milestones, proposal status and billing in one place.",
      },
      { property: "og:title", content: "Project Details — theroyeffect.com" },
      {
        property: "og:description",
        content: "Project details, milestones, proposal status and billing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProjectDetailPage,
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
    : "—";

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(
    cents / 100,
  );

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-white/[0.02] p-4">
      <p className="font-mono text-[10px] tracking-widest text-white/40">{label}</p>
      <p className="mt-2 font-mono text-xs text-white/80">{value}</p>
    </div>
  );
}

function MilestoneRow({ m }: { m: PortalMilestone }) {
  return (
    <li className="relative">
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
  );
}

function ProposalCard({ p }: { p: ProjectProposal }) {
  const signed = p.status === "signed";
  return (
    <div className="border border-white/10 bg-white/[0.02] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg uppercase text-white">{p.project_title}</p>
          <p className="mt-1 font-mono text-[11px] text-white/40">
            SENT {date(p.created_at).toUpperCase()} · TIMELINE {p.timeline_weeks.toUpperCase()}
          </p>
        </div>
        <span
          className={`px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${
            signed ? "bg-emerald-500 text-black" : "bg-[#FF3333] text-black"
          }`}
        >
          {signed ? "SIGNED" : p.status === "viewed" ? "VIEWED" : "AWAITING SIGNATURE"}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Fact label="TOTAL" value={money(p.total_price_cents, "usd")} />
        <Fact label="DEPOSIT" value={money(p.deposit_cents, "usd")} />
        <Fact label="BALANCE" value={money(p.balance_cents, "usd")} />
      </div>
      <a
        href={`/proposal/${p.share_token}`}
        className="mt-4 inline-flex items-center gap-1.5 border border-[#FF3333] bg-[#FF3333]/10 px-3 py-1.5 font-mono text-[10px] tracking-widest text-[#FF3333] transition-colors hover:bg-[#FF3333] hover:text-black"
      >
        {signed ? "VIEW PROPOSAL" : "REVIEW & SIGN"} <ExternalLink className="size-3" />
      </a>
    </div>
  );
}

function ProjectDetailPage() {
  const { projectId } = useParams({ from: "/_authenticated/projects/$projectId" });
  const fetchPortal = useServerFn(getMyPortal);
  const fetchProposals = useServerFn(getMyProposals);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["client-portal"],
    queryFn: () => fetchPortal(),
  });
  const { data: proposals } = useQuery({
    queryKey: ["client-proposals"],
    queryFn: () => fetchProposals(),
  });

  const project: PortalProject | undefined = data?.projects.find((p) => p.id === projectId);
  const done = project?.milestones.filter((m) => m.status === "done").length ?? 0;
  const total = project?.milestones.length ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const related = (proposals ?? []).filter(
    (p) =>
      !project ||
      p.project_title.toLowerCase().trim() === project.title.toLowerCase().trim() ||
      (proposals ?? []).length === 1,
  );
  const shown = related.length > 0 ? related : (proposals ?? []);
  const invoices = data?.invoices ?? [];

  return (
    <main className="min-h-screen bg-[#030014] px-5 py-12 md:px-10">
      <div className="mx-auto max-w-4xl">
        <Logo variant="compact" size="md" href="/" className="mb-6" />
        <Link
          to="/portal"
          className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest text-white/50 transition-colors hover:text-[#FF3333]"
        >
          <ArrowLeft className="size-3" /> BACK TO DASHBOARD
        </Link>

        {isLoading && (
          <p className="mt-10 font-mono text-xs text-white/50">Loading your project…</p>
        )}
        {isError && (
          <p className="mt-10 font-mono text-xs text-[#FF3333]">
            We couldn&apos;t load this project. Please refresh and try again.
          </p>
        )}

        {!isLoading && !isError && !project && (
          <p className="mt-10 font-mono text-xs text-white/50">
            This project isn&apos;t on your account.
          </p>
        )}

        {project && (
          <>
            <header className="mt-6 border border-white/10 bg-white/[0.02] p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h1 className="font-display text-3xl uppercase leading-tight text-white">
                  {project.title}
                </h1>
                <span className="border border-[#FF3333]/50 bg-[#FF3333]/10 px-3 py-1 font-mono text-[10px] tracking-widest text-[#FF3333]">
                  {STATUS_LABELS[project.status] ?? project.status.toUpperCase()}
                </span>
              </div>
              {project.summary && (
                <p className="mt-4 font-mono text-xs leading-relaxed text-white/60">
                  {project.summary}
                </p>
              )}
              <div className="mt-6 h-1.5 w-full bg-white/10">
                <div className="h-full bg-[#FF3333] transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 font-mono text-[10px] tracking-widest text-white/40">
                {pct}% COMPLETE · {done}/{total} MILESTONES
              </p>
            </header>

            <section className="mt-6 grid gap-3 sm:grid-cols-3">
              <Fact label="STARTED" value={date(project.start_date || project.created_at)} />
              <Fact label="TARGET DELIVERY" value={date(project.target_date)} />
              <Fact label="UP NEXT" value={project.next_step || "To be scheduled"} />
            </section>

            <section className="mt-10">
              <h2 className="mb-5 font-mono text-[11px] tracking-widest text-white/40">
                MILESTONES
              </h2>
              {project.milestones.length === 0 ? (
                <p className="font-mono text-xs text-white/40">
                  Milestones will appear here as the project kicks off.
                </p>
              ) : (
                <ol className="relative space-y-6 border-l border-white/10 pl-6">
                  {project.milestones.map((m) => (
                    <MilestoneRow key={m.id} m={m} />
                  ))}
                </ol>
              )}
            </section>

            <section className="mt-10">
              <h2 className="mb-5 font-mono text-[11px] tracking-widest text-white/40">
                PROPOSAL STATUS
              </h2>
              {shown.length === 0 ? (
                <p className="font-mono text-xs text-white/40">
                  No proposal on file yet for this project.
                </p>
              ) : (
                <div className="space-y-4">
                  {shown.map((p) => (
                    <ProposalCard key={p.id} p={p} />
                  ))}
                </div>
              )}
            </section>

            <section className="mt-10">
              <h2 className="mb-5 font-mono text-[11px] tracking-widest text-white/40">BILLING</h2>
              {invoices.length === 0 ? (
                <p className="font-mono text-xs text-white/40">No invoices yet.</p>
              ) : (
                <div className="divide-y divide-white/10 border border-white/10">
                  {invoices.map((inv) => (
                    <div
                      key={`${inv.kind}-${inv.id}`}
                      className="flex flex-wrap items-center gap-3 p-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-sm uppercase text-white">
                          {inv.description}
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-white/40">
                          {date(inv.issued_at)} · {inv.status.replace(/_/g, " ").toUpperCase()}
                          {inv.balance_due_cents > 0
                            ? ` · ${money(inv.balance_due_cents, inv.currency)} REMAINING`
                            : ""}
                        </p>
                      </div>
                      <span className="font-mono text-sm text-white">
                        {money(inv.amount_cents, inv.currency)}
                      </span>
                    </div>
                  ))}
                  <div className="p-4">
                    <Link
                      to="/portal"
                      className="font-mono text-[10px] tracking-widest text-[#FF3333] hover:underline"
                    >
                      PAY A BALANCE IN YOUR DASHBOARD →
                    </Link>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
