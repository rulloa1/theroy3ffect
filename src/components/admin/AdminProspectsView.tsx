import { useMemo, useState } from "react";
import {
  BarChart3,
  ExternalLink,
  FlaskConical,
  Mail,
  Radar,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { INDUSTRIES, INDUSTRY_GROUPS } from "@/lib/prospecting/industries";
import type { Prospect, ProspectAnalytics } from "@/utils/prospects.functions";
import { ProspectAnalyticsPanel } from "./ProspectAnalyticsPanel";

export interface AdminProspectsViewProps {
  prospects: Prospect[];
  busy: string | null;
  analytics: ProspectAnalytics | undefined;
  onFind: (industry: string) => Promise<void>;
  onScanPending: () => Promise<void>;
  onDraft: (id: string) => Promise<void>;
  onSaveDraft: (id: string, subject: string, body: string, email: string | null) => Promise<void>;
  onSend: (id: string) => Promise<void>;
  onUpdate: (id: string, patch: { status?: string; contactEmail?: string | null }) => Promise<void>;
  onGenerateVariants: (id: string) => Promise<void>;
  onSelectVariant: (id: string, key: "A" | "B") => Promise<void>;
  onSyncCrm: () => Promise<void>;
  date: (value: string | null) => string;
}

type Tab = "hot" | "all" | "drafted" | "contacted" | "analytics";

const painTone = (score: number) =>
  score >= 40 ? "text-[#FF3333]" : score >= 20 ? "text-amber-300" : "text-white/50";


export function AdminProspectsView({
  prospects,
  busy,
  analytics,
  onFind,
  onScanPending,
  onDraft,
  onSaveDraft,
  onSend,
  onUpdate,
  onGenerateVariants,
  onSelectVariant,
  onSyncCrm,
  date,
}: AdminProspectsViewProps) {
  const [industry, setIndustry] = useState(INDUSTRIES[0]?.key ?? "");
  const [tab, setTab] = useState<Tab>("hot");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [email, setEmail] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (tab === "analytics") return [];
    return prospects.filter((p) => {
      if (q && !p.business_name.toLowerCase().includes(q)) return false;
      if (tab === "hot") return p.pain_score >= 20 && p.status === "new";
      if (tab === "drafted") return p.draft_status === "draft";
      if (tab === "contacted") return p.status === "contacted" || p.draft_status === "sent";
      return true;
    });
  }, [prospects, tab, query]);


  const pendingScans = prospects.filter((p) => p.website && !p.scanned_at).length;

  const startEdit = (p: Prospect) => {
    setEditingId(p.id);
    setSubject(p.draft_subject ?? "");
    setBody(p.draft_body ?? "");
    setEmail(p.contact_email ?? "");
  };

  return (
    <div className="space-y-6">
      {/* Finder controls */}
      <div className="flex flex-wrap items-end gap-4 border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-start gap-3">
          <Radar className="mt-0.5 size-5 text-[#FF3333]" />
          <div>
            <p className="font-mono text-xs tracking-widest text-white">PROSPECT FINDER</p>
            <p className="mt-1 max-w-md font-mono text-[10px] leading-relaxed text-white/40">
              Finds Houston businesses in one trade, checks their websites, and ranks them by how much the site is
              costing them. Nothing is emailed until you press send.
            </p>
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] tracking-widest text-white/40">INDUSTRY</span>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="border border-white/10 bg-black px-3 py-2 font-mono text-xs text-white"
          >
            {INDUSTRY_GROUPS.map((group) => (
              <optgroup key={group.key} label={group.label}>
                {INDUSTRIES.filter((i) => i.group === group.key).map((i) => (
                  <option key={i.key} value={i.key}>
                    {i.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <button
          type="button"
          disabled={busy !== null}
          onClick={() => onFind(industry)}
          className="flex items-center gap-2 bg-[#FF3333] px-5 py-2.5 font-mono text-xs font-bold tracking-widest text-black disabled:opacity-50"
        >
          <Search className="size-3.5" />
          {busy === "find" ? "SEARCHING…" : "FIND PROSPECTS"}
        </button>

        <button
          type="button"
          disabled={busy !== null || pendingScans === 0}
          onClick={onScanPending}
          className="flex items-center gap-2 border border-white/10 px-5 py-2.5 font-mono text-xs tracking-widest text-white/70 hover:text-white disabled:opacity-40"
        >
          <RefreshCw className="size-3.5" />
          CHECK {pendingScans} PENDING SITE{pendingScans === 1 ? "" : "S"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {(
          [
            ["hot", `WORTH CONTACTING (${prospects.filter((p) => p.pain_score >= 20 && p.status === "new").length})`],
            ["drafted", `DRAFTED (${prospects.filter((p) => p.draft_status === "draft").length})`],
            ["contacted", `CONTACTED (${prospects.filter((p) => p.draft_status === "sent").length})`],
            ["all", `ALL (${prospects.length})`],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2 font-mono text-[10px] tracking-widest ${
              tab === key ? "bg-white text-black" : "border border-white/10 text-white/50 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name"
          className="ml-auto border border-white/10 bg-black px-3 py-2 font-mono text-xs text-white placeholder:text-white/30"
        />
      </div>

      {filtered.length === 0 && (
        <p className="border border-white/10 bg-white/[0.02] p-6 font-mono text-xs text-white/40">
          Nothing here yet. Pick an industry above and run the finder.
        </p>
      )}

      <div className="space-y-4">
        {filtered.map((p) => {
          const editing = editingId === p.id;
          return (
            <article key={p.id} className="border border-white/10 bg-white/[0.02] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="truncate font-bold tracking-tight text-white">{p.business_name}</h3>
                    <span className={`font-mono text-xs ${painTone(p.pain_score)}`}>
                      PAIN {p.pain_score}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-white/40">
                    {[p.address, p.phone].filter(Boolean).join(" · ") || "No address on file"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {p.website ? (
                      <a
                        href={p.website}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 font-mono text-[10px] text-white/60 underline"
                      >
                        {p.website.replace(/^https?:\/\//, "").slice(0, 40)}
                        <ExternalLink className="size-3" />
                      </a>
                    ) : (
                      <span className="bg-[#FF3333] px-2 py-0.5 font-mono text-[10px] font-bold text-black">
                        NO WEBSITE
                      </span>
                    )}
                    <a
                      href={`/site-report/${p.report_token}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 font-mono text-[10px] text-white/60 underline"
                    >
                      Their report <ExternalLink className="size-3" />
                    </a>
                    {p.report_viewed_at && (
                      <span className="font-mono text-[10px] text-emerald-300">
                        Report opened {date(p.report_viewed_at)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={p.status}
                    onChange={(e) => onUpdate(p.id, { status: e.target.value })}
                    className="border border-white/10 bg-black px-2 py-1.5 font-mono text-[10px] text-white"
                  >
                    {["new", "queued", "contacted", "replied", "won", "lost", "skipped"].map((s) => (
                      <option key={s} value={s}>
                        {s.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => onDraft(p.id)}
                    className="flex items-center gap-2 border border-white/10 px-3 py-1.5 font-mono text-[10px] tracking-widest text-white/70 hover:text-white disabled:opacity-40"
                  >
                    <Sparkles className="size-3" />
                    {busy === `draft-${p.id}` ? "WRITING…" : p.draft_body ? "REWRITE" : "WRITE EMAIL"}
                  </button>
                </div>
              </div>

              <ul className="mt-4 flex flex-wrap gap-2">
                {(p.signals ?? []).slice(0, 4).map((s) => (
                  <li
                    key={s.code}
                    className={`border px-2 py-1 font-mono text-[10px] ${
                      s.severity === "critical"
                        ? "border-[#FF3333]/40 text-[#FF3333]"
                        : "border-white/10 text-white/50"
                    }`}
                  >
                    {s.label}
                  </li>
                ))}
              </ul>

              {(p.draft_body || editing) && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  {p.draft_rationale && !editing && (
                    <p className="mb-3 font-mono text-[10px] italic text-white/40">{p.draft_rationale}</p>
                  )}
                  {editing ? (
                    <div className="space-y-3">
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="their@email.com"
                        className="w-full border border-white/10 bg-black px-3 py-2 font-mono text-xs text-white"
                      />
                      <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full border border-white/10 bg-black px-3 py-2 font-mono text-xs text-white"
                      />
                      <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={8}
                        className="w-full border border-white/10 bg-black px-3 py-2 font-mono text-xs text-white"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={async () => {
                            await onSaveDraft(p.id, subject, body, email.trim() || null);
                            setEditingId(null);
                          }}
                          className="bg-white px-4 py-2 font-mono text-[10px] font-bold tracking-widest text-black disabled:opacity-50"
                        >
                          SAVE
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="border border-white/10 px-4 py-2 font-mono text-[10px] tracking-widest text-white/60"
                        >
                          CANCEL
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="font-mono text-xs font-bold text-white">{p.draft_subject}</p>
                      <p className="mt-2 whitespace-pre-wrap font-mono text-xs leading-relaxed text-white/70">
                        {p.draft_body}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1 font-mono text-[10px] text-white/40">
                          <Mail className="size-3" />
                          {p.contact_email ?? "No email found — add one to send"}
                        </span>
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          className="border border-white/10 px-3 py-1.5 font-mono text-[10px] tracking-widest text-white/60 hover:text-white"
                        >
                          EDIT
                        </button>
                        <button
                          type="button"
                          disabled={busy !== null || !p.contact_email || p.draft_status === "sent"}
                          onClick={() => onSend(p.id)}
                          className="flex items-center gap-2 bg-[#FF3333] px-4 py-1.5 font-mono text-[10px] font-bold tracking-widest text-black disabled:opacity-40"
                        >
                          <Send className="size-3" />
                          {p.draft_status === "sent"
                            ? `SENT ${date(p.contacted_at)}`
                            : busy === `send-${p.id}`
                              ? "SENDING…"
                              : "SEND"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {p.draft_status === "failed" && p.notes && (
                <p className="mt-3 font-mono text-[10px] text-amber-300">{p.notes}</p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
