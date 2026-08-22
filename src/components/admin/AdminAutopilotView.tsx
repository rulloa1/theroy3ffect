import { useMemo, useState } from "react";
import { Bot, Check, Pause, Play, RefreshCw, RotateCcw, Send, X } from "lucide-react";
import { FOLLOWUP_PLAYBOOKS } from "@/lib/automation/playbooks";
import type { AutopilotState, FollowupDraft } from "@/utils/automation.functions";

export interface AdminAutopilotViewProps {
  state: AutopilotState | undefined;
  busy: string | null;
  onRun: () => Promise<void>;
  onTogglePause: (paused: boolean) => Promise<void>;
  onApprove: (id: string) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
  onRetry: (id: string) => Promise<void>;
  onSave: (id: string, subject: string, body: string) => Promise<void>;
  date: (value: string | null) => string;
}

type Tab = "draft" | "sent" | "dismissed" | "failed";

const playbookLabel = (key: string) =>
  (FOLLOWUP_PLAYBOOKS as Record<string, { label: string }>)[key]?.label ?? key;

export function AdminAutopilotView({
  state,
  busy,
  onRun,
  onTogglePause,
  onApprove,
  onDismiss,
  onRetry,
  onSave,
  date,
}: AdminAutopilotViewProps) {
  const [tab, setTab] = useState<Tab>("draft");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const drafts = state?.drafts ?? [];
  const counts = useMemo(() => {
    const base: Record<Tab, number> = { draft: 0, sent: 0, dismissed: 0, failed: 0 };
    for (const d of drafts) if (d.status in base) base[d.status as Tab] += 1;
    return base;
  }, [drafts]);

  const visible = drafts.filter((d) => d.status === tab);
  const paused = state?.job?.status === "paused";

  const startEdit = (draft: FollowupDraft) => {
    setEditingId(draft.id);
    setSubject(draft.subject);
    setBody(draft.body);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-start gap-3">
          <Bot className="mt-0.5 size-5 text-[#FF3333]" />
          <div>
            <p className="font-mono text-[10px] tracking-widest text-white/40">FOLLOW-UP AUTOPILOT</p>
            <p className="mt-1 text-sm text-white/80">
              {paused ? "Paused" : "Active"} · scans hourly · last run {date(state?.job?.last_run_at ?? null)} ·{" "}
              {state?.job?.items_processed ?? 0} drafts written
            </p>
            {state?.job?.paused_reason ? (
              <p className="mt-1 font-mono text-[10px] text-[#FF3333]">
                {state.job.paused_reason}
              </p>
            ) : null}
            {state?.job?.last_error ? (
              <p className="mt-1 font-mono text-[10px] text-yellow-400/80">
                Last error: {state.job.last_error}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void onRun()}
            disabled={busy === "autopilot-run"}
            className="flex items-center gap-2 border border-white/15 px-3 py-1.5 font-mono text-[10px] tracking-widest text-white/70 transition-colors hover:border-white/40 hover:text-white disabled:opacity-40"
          >
            <RefreshCw className={`size-3 ${busy === "autopilot-run" ? "animate-spin" : ""}`} />
            SCAN NOW
          </button>
          <button
            onClick={() => void onTogglePause(!paused)}
            disabled={busy === "autopilot-toggle"}
            className="flex items-center gap-2 border border-white/15 px-3 py-1.5 font-mono text-[10px] tracking-widest text-white/70 transition-colors hover:border-white/40 hover:text-white disabled:opacity-40"
          >
            {paused ? <Play className="size-3" /> : <Pause className="size-3" />}
            {paused ? "RESUME" : "PAUSE"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {(["draft", "sent", "dismissed", "failed"] as Tab[]).map((key) => (
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
          <Bot className="mx-auto size-8 text-white/20" />
          <p className="mt-3 font-mono text-xs text-white/40">
            {tab === "draft"
              ? "No follow-ups waiting. Autopilot will draft new ones as leads go cold."
              : `No ${tab} follow-ups.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((draft) => {
            const editing = editingId === draft.id;
            return (
              <article key={draft.id} className="border border-white/10 bg-white/[0.02] p-4">
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] tracking-widest text-[#FF3333]">
                      {playbookLabel(draft.playbook).toUpperCase()}
                    </p>
                    <p className="mt-1 text-sm text-white">
                      {draft.recipient_name}{" "}
                      <span className="text-white/40">&lt;{draft.recipient_email}&gt;</span>
                    </p>
                  </div>
                  <p className="font-mono text-[10px] text-white/30">{date(draft.created_at)}</p>
                </header>

                {draft.rationale ? (
                  <p className="mt-3 border-l-2 border-white/10 pl-3 font-mono text-[11px] text-white/50">
                    {draft.rationale}
                  </p>
                ) : null}

                {editing ? (
                  <div className="mt-4 space-y-2">
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#FF3333]"
                      aria-label="Subject"
                    />
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={8}
                      className="w-full border border-white/15 bg-black/40 px-3 py-2 text-sm leading-relaxed text-white/90 outline-none focus:border-[#FF3333]"
                      aria-label="Body"
                    />
                  </div>
                ) : (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-white">{draft.subject}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/70">
                      {draft.body}
                    </p>
                    {draft.cta_label ? (
                      <p className="mt-3 font-mono text-[10px] text-white/40">
                        CTA: {draft.cta_label} → {draft.cta_url}
                      </p>
                    ) : null}
                  </div>
                )}

                {draft.error_message ? (
                  <p className="mt-3 font-mono text-[10px] text-[#FF3333]">{draft.error_message}</p>
                ) : null}

                <footer className="mt-4 flex flex-wrap gap-2">
                  {draft.status === "draft" ? (
                    editing ? (
                      <>
                        <button
                          onClick={async () => {
                            await onSave(draft.id, subject, body);
                            setEditingId(null);
                          }}
                          disabled={busy === draft.id}
                          className="flex items-center gap-2 bg-white px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest text-black disabled:opacity-40"
                        >
                          <Check className="size-3" /> SAVE
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex items-center gap-2 border border-white/15 px-3 py-1.5 font-mono text-[10px] tracking-widest text-white/70 hover:text-white"
                        >
                          <X className="size-3" /> CANCEL
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => void onApprove(draft.id)}
                          disabled={busy === draft.id}
                          className="flex items-center gap-2 bg-[#FF3333] px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest text-black disabled:opacity-40"
                        >
                          <Send className="size-3" /> APPROVE & SEND
                        </button>
                        <button
                          onClick={() => startEdit(draft)}
                          className="border border-white/15 px-3 py-1.5 font-mono text-[10px] tracking-widest text-white/70 hover:border-white/40 hover:text-white"
                        >
                          EDIT
                        </button>
                        <button
                          onClick={() => void onDismiss(draft.id)}
                          disabled={busy === draft.id}
                          className="flex items-center gap-2 border border-white/15 px-3 py-1.5 font-mono text-[10px] tracking-widest text-white/50 hover:text-white disabled:opacity-40"
                        >
                          <X className="size-3" /> DISMISS
                        </button>
                      </>
                    )
                  ) : null}
                  {draft.status === "failed" ? (
                    <button
                      onClick={() => void onRetry(draft.id)}
                      disabled={busy === draft.id}
                      className="flex items-center gap-2 border border-white/15 px-3 py-1.5 font-mono text-[10px] tracking-widest text-white/70 hover:text-white disabled:opacity-40"
                    >
                      <RotateCcw className="size-3" /> MOVE BACK TO DRAFTS
                    </button>
                  ) : null}
                  {draft.status === "sent" ? (
                    <p className="font-mono text-[10px] text-green-400/70">
                      SENT {date(draft.sent_at)}
                    </p>
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
