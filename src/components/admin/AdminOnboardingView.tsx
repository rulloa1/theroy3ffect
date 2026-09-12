import { useMemo, useState } from "react";
import { Check, Rocket, RefreshCw, RotateCcw, X, ExternalLink } from "lucide-react";
import { ONBOARDING_PLAYBOOKS } from "@/lib/automation/onboarding-playbooks";
import type { OnboardingRun } from "@/utils/onboarding.functions";

export interface AdminOnboardingViewProps {
  runs: OnboardingRun[];
  busy: string | null;
  onRunQueue: () => Promise<void>;
  onApprove: (id: string) => Promise<void>;
  onRetry: (id: string) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
  date: (value: string | null) => string;
  money: (cents: number, currency: string) => string;
}

type Tab = "ready" | "pending" | "approved" | "failed" | "dismissed";

const TABS: Tab[] = ["ready", "pending", "approved", "failed", "dismissed"];

const triggerLabel = (key: string) => ONBOARDING_PLAYBOOKS[key]?.label ?? key;

export function AdminOnboardingView({
  runs,
  busy,
  onRunQueue,
  onApprove,
  onRetry,
  onDismiss,
  date,
  money,
}: AdminOnboardingViewProps) {
  const [tab, setTab] = useState<Tab>("ready");

  const counts = useMemo(() => {
    const base: Record<Tab, number> = {
      ready: 0,
      pending: 0,
      approved: 0,
      failed: 0,
      dismissed: 0,
    };
    for (const run of runs) if (run.status in base) base[run.status as Tab] += 1;
    return base;
  }, [runs]);

  const visible = runs.filter((r) => r.status === tab);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-start gap-3">
          <Rocket className="mt-0.5 size-5 text-[#FF3333]" />
          <div>
            <p className="font-mono text-[10px] tracking-widest text-white/40">
              PURCHASE SETUP AGENT
            </p>
            <p className="mt-1 text-sm text-white/80">
              Every paid discovery call, commission and retainer gets a portal project, a milestone
              plan and an automatic welcome email. Everything else waits for you here.
            </p>
          </div>
        </div>
        <button
          onClick={() => void onRunQueue()}
          disabled={busy === "onboarding-run"}
          className="flex items-center gap-2 border border-white/15 px-3 py-1.5 font-mono text-[10px] tracking-widest text-white/70 transition-colors hover:border-white/40 hover:text-white disabled:opacity-40"
        >
          <RefreshCw className={`size-3 ${busy === "onboarding-run" ? "animate-spin" : ""}`} />
          RUN QUEUE NOW
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {TABS.map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 font-mono text-[10px] tracking-widest transition-colors ${
              tab === key
                ? "bg-[#FF3333] font-bold text-black"
                : "border border-white/10 text-white/60 hover:border-white/30 hover:text-white"
            }`}
          >
            {key.toUpperCase()} ({counts[key]})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="border border-dashed border-white/10 py-16 text-center">
          <Rocket className="mx-auto size-8 text-white/20" />
          <p className="mt-3 font-mono text-xs text-white/40">
            {tab === "ready"
              ? "Nothing waiting for review. New purchases appear here already set up."
              : `No ${tab} setups.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((run) => {
            const milestones = run.plan?.milestones ?? [];
            return (
              <article key={run.id} className="border border-white/10 bg-white/[0.02] p-4">
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] tracking-widest text-[#FF3333]">
                      {triggerLabel(run.trigger_type).toUpperCase()}
                    </p>
                    <p className="mt-1 text-sm text-white">
                      {run.client_name || "Unnamed client"}{" "}
                      <span className="text-white/40">&lt;{run.client_email}&gt;</span>
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-white/50">
                      {run.product_name || "Purchase"} ·{" "}
                      {money(run.amount_cents ?? 0, run.currency ?? "usd")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] text-white/30">{date(run.created_at)}</p>
                    <p className="mt-1 font-mono text-[10px] text-white/40">
                      {run.welcome_email_sent_at
                        ? `WELCOME EMAIL SENT ${date(run.welcome_email_sent_at)}`
                        : "WELCOME EMAIL NOT SENT"}
                    </p>
                  </div>
                </header>

                {run.plan?.projectTitle ? (
                  <p className="mt-4 text-sm font-semibold text-white">{run.plan.projectTitle}</p>
                ) : null}
                {run.plan?.summary ? (
                  <p className="mt-1 text-sm leading-relaxed text-white/70">{run.plan.summary}</p>
                ) : null}
                {run.plan?.nextStep ? (
                  <p className="mt-2 font-mono text-[11px] text-[#DFBA73]">
                    CLIENT&apos;S NEXT STEP: {run.plan.nextStep}
                  </p>
                ) : null}

                {milestones.length ? (
                  <ol className="mt-4 space-y-1.5">
                    {milestones.map((m, index) => (
                      <li key={m.title} className="font-mono text-[11px] text-white/60">
                        <span className="text-white/30">
                          {String(index + 1).padStart(2, "0")}
                        </span>{" "}
                        <span className="text-white/85">{m.title}</span>
                        {m.note ? <span className="text-white/45"> — {m.note}</span> : null}
                        <span className="text-white/25"> · day {m.dueInDays}</span>
                      </li>
                    ))}
                  </ol>
                ) : null}

                {run.rationale ? (
                  <p className="mt-4 border-l-2 border-white/10 pl-3 font-mono text-[11px] text-white/50">
                    {run.rationale}
                  </p>
                ) : null}

                {run.error_message ? (
                  <p className="mt-3 font-mono text-[10px] text-[#FF3333]">{run.error_message}</p>
                ) : null}

                <footer className="mt-4 flex flex-wrap items-center gap-2">
                  {run.project_id ? (
                    <a
                      href={`/projects/${run.project_id}`}
                      className="flex items-center gap-2 border border-white/15 px-3 py-1.5 font-mono text-[10px] tracking-widest text-white/70 hover:border-white/40 hover:text-white"
                    >
                      <ExternalLink className="size-3" /> VIEW PROJECT
                    </a>
                  ) : null}
                  {run.status === "ready" ? (
                    <button
                      onClick={() => void onApprove(run.id)}
                      disabled={busy === run.id}
                      className="flex items-center gap-2 bg-[#FF3333] px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest text-black disabled:opacity-40"
                    >
                      <Check className="size-3" /> MARK HANDLED
                    </button>
                  ) : null}
                  {run.status !== "approved" ? (
                    <button
                      onClick={() => void onRetry(run.id)}
                      disabled={busy === run.id}
                      className="flex items-center gap-2 border border-white/15 px-3 py-1.5 font-mono text-[10px] tracking-widest text-white/70 hover:border-white/40 hover:text-white disabled:opacity-40"
                    >
                      <RotateCcw className="size-3" /> RE-RUN SETUP
                    </button>
                  ) : null}
                  {run.status !== "dismissed" ? (
                    <button
                      onClick={() => void onDismiss(run.id)}
                      disabled={busy === run.id}
                      className="flex items-center gap-2 border border-white/15 px-3 py-1.5 font-mono text-[10px] tracking-widest text-white/50 hover:text-white disabled:opacity-40"
                    >
                      <X className="size-3" /> DISMISS
                    </button>
                  ) : null}
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
