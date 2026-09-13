import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ExternalLink,
  Loader2,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@/components/Logo";
import { decideMilestoneApproval, getMyPortal, type PortalMilestone, type PortalProject } from "@/utils/portal.functions";
import { getMyProposals, type ProjectProposal } from "@/utils/proposals.functions";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  validateSearch: (search: Record<string, unknown>): { approval?: string } =>
    typeof search["approval"] === "string" ? { approval: search["approval"] as string } : {},
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

function MilestoneRow({ m, focused }: { m: PortalMilestone; focused: boolean }) {
  const queryClient = useQueryClient();
  const decide = useServerFn(decideMilestoneApproval);
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [busy, setBusy] = useState(false);
  const current = m.approvals[0];
  const awaiting = current?.status === "awaiting_review";
  const decideNow = async (decision: "approved" | "changes_requested") => {
    if (!current) return;
    setBusy(true);
    try {
      await decide({ data: { approvalId: current.id, decision, feedback: feedback.trim() } });
      toast.success(decision === "approved" ? "Stage approved" : "Change request sent");
      setFeedback("");
      setShowFeedback(false);
      await queryClient.invalidateQueries({ queryKey: ["client-portal"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your decision");
    } finally {
      setBusy(false);
    }
  };
  return (
    <li id={current ? `approval-${current.id}` : undefined} className={`relative scroll-mt-8 ${focused ? "border border-[#DFBA73]/50 bg-[#DFBA73]/5 p-4" : ""}`}>
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
        <span className="border border-white/15 px-2 py-0.5 font-mono text-[9px] tracking-widest text-white/50">
          {m.stage_type.toUpperCase()}
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
      {(current?.review_url || m.link) && (
        <a
          href={current?.review_url || m.link || undefined}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 border border-[#FF3333]/40 bg-[#FF3333]/10 px-3 py-1.5 font-mono text-[11px] tracking-widest text-[#FF3333] transition-colors hover:bg-[#FF3333] hover:text-black"
        >
          VIEW DELIVERABLE <ExternalLink className="size-3" />
        </a>
      )}
      {current && (
        <div className={`mt-3 border p-4 ${
          current.status === "approved" ? "border-emerald-500/40 bg-emerald-500/5" :
          current.status === "changes_requested" ? "border-[#FF3333]/40 bg-[#FF3333]/5" :
          "border-[#DFBA73]/40 bg-[#DFBA73]/5"
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-[10px] tracking-widest text-[#DFBA73]">
              {current.status.replace(/_/g, " ").toUpperCase()}
            </p>
            <p className="font-mono text-[10px] text-white/40">
              {current.decided_at ? `SIGNED OFF ${date(current.decided_at).toUpperCase()}` : `SENT ${date(current.requested_at).toUpperCase()}`}
            </p>
          </div>
          {current.review_note && <p className="mt-2 font-mono text-xs leading-relaxed text-white/70">{current.review_note}</p>}
          {current.client_feedback && <p className="mt-3 border-l-2 border-[#FF3333] pl-3 font-mono text-xs leading-relaxed text-white/80">{current.client_feedback}</p>}
          {awaiting && !showFeedback && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => void decideNow("approved")} className="inline-flex min-h-11 items-center gap-2 bg-[#DFBA73] px-4 font-mono text-[10px] font-bold tracking-widest text-black hover:bg-white disabled:opacity-50">
                <ShieldCheck className="size-4" /> APPROVE STAGE
              </button>
              <button type="button" disabled={busy} onClick={() => setShowFeedback(true)} className="inline-flex min-h-11 items-center gap-2 border border-white/20 px-4 font-mono text-[10px] tracking-widest text-white hover:border-[#FF3333] hover:text-[#FF3333] disabled:opacity-50">
                <MessageSquareText className="size-4" /> REQUEST CHANGES
              </button>
            </div>
          )}
          {awaiting && showFeedback && (
            <div className="mt-4 space-y-3">
              <label className="block font-mono text-[10px] tracking-widest text-white/60" htmlFor={`feedback-${current.id}`}>WHAT SHOULD CHANGE?</label>
              <textarea id={`feedback-${current.id}`} value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4} maxLength={3000} className="w-full border border-white/15 bg-black/20 p-3 font-mono text-sm text-white focus:border-[#DFBA73] focus:outline-none" />
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy || !feedback.trim()} onClick={() => void decideNow("changes_requested")} className="min-h-11 bg-[#FF3333] px-4 font-mono text-[10px] font-bold tracking-widest text-black disabled:opacity-40">SEND CHANGE REQUEST</button>
                <button type="button" disabled={busy} onClick={() => setShowFeedback(false)} className="min-h-11 border border-white/20 px-4 font-mono text-[10px] tracking-widest text-white/70">CANCEL</button>
              </div>
            </div>
          )}
        </div>
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
  const { approval: focusedApproval } = Route.useSearch();
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

  useEffect(() => {
    if (!focusedApproval || !project) return;
    document.getElementById(`approval-${focusedApproval}`)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "center",
    });
  }, [focusedApproval, project]);

  return (
    <main className="min-h-screen bg-[#030014] px-5 py-12 md:px-10">
      <Toaster />
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
                LIVE PROJECT TIMELINE &amp; APPROVALS
              </h2>
              {project.milestones.length === 0 ? (
                <p className="font-mono text-xs text-white/40">
                  Milestones will appear here as the project kicks off.
                </p>
              ) : (
                <ol className="relative space-y-6 border-l border-white/10 pl-6">
                  {project.milestones.map((m) => (
                    <MilestoneRow key={m.id} m={m} focused={m.approvals.some((a) => a.id === focusedApproval)} />
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
