import { useState } from "react";
import {
  CalendarClock,
  Mail,
  Phone,
  Search,
  Globe,
  AlertTriangle,
  Users,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { LEAD_STAGES, type CrmLead } from "@/utils/crm.functions";

const STAGE_LABELS: Record<string, string> = {
  new: "NEW",
  contacted: "CONTACTED",
  discovery_scheduled: "CALL BOOKED",
  proposal_sent: "PROPOSAL SENT",
  won: "WON",
  lost: "LOST",
};

const STAGE_COLOR: Record<string, string> = {
  new: "border-[#FF3333]/40 bg-[#FF3333]/10 text-[#FF3333]",
  contacted: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  discovery_scheduled: "border-blue-400/40 bg-blue-400/10 text-blue-300",
  proposal_sent: "border-purple-400/40 bg-purple-400/10 text-purple-300",
  won: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  lost: "border-white/15 bg-white/5 text-white/40",
};

function nextAction(lead: CrmLead) {
  const openFollowup = lead.followups.find((f) => f.status === "open");
  if (openFollowup) return `Call back: ${openFollowup.reason}`;

  const upcoming = lead.bookings
    .filter((b) => b.status === "scheduled" && new Date(b.slot_start).getTime() > Date.now())
    .sort((a, b) => +new Date(a.slot_start) - +new Date(b.slot_start))[0];
  if (upcoming) return "Prepare for discovery call";

  const pastScheduled = lead.bookings.find(
    (b) => b.status === "scheduled" && new Date(b.slot_start).getTime() <= Date.now(),
  );
  if (pastScheduled) return "Mark call complete & send proposal";

  const pendingAudit = lead.audits.find((a) => a.status === "audit_in_progress");
  if (pendingAudit) return "Deliver the free audit";

  if (lead.stage === "proposal_sent") return "Chase proposal signature";
  if (lead.stage === "won") return "Kick off project brief";
  if (lead.stage === "lost") return "No action";
  if (lead.stage === "contacted") return "Book a discovery call";
  return "Reach out and qualify";
}

export interface AdminPipelineViewProps {
  leads: CrmLead[];
  onUpdateStage: (leadId: string, stage: string) => Promise<void>;
  onUpdateBooking: (bookingId: string, status: string) => Promise<void>;
  onResolveFollowup: (followupId: string, status: string) => Promise<void>;
  date: (value: string | null) => string;
}

export function AdminPipelineView({
  leads,
  onUpdateStage,
  onUpdateBooking,
  onResolveFollowup,
  date,
}: AdminPipelineViewProps) {
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = leads.filter((lead) => {
    if (stageFilter !== "ALL" && lead.stage !== stageFilter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      lead.full_name.toLowerCase().includes(q) ||
      (lead.email ?? "").toLowerCase().includes(q) ||
      (lead.company_name ?? "").toLowerCase().includes(q) ||
      (lead.phone ?? "").toLowerCase().includes(q)
    );
  });

  const counts = LEAD_STAGES.map((stage) => ({
    stage,
    count: leads.filter((l) => l.stage === stage).length,
  }));

  const run = async (key: string, fn: () => Promise<void>, message: string) => {
    setBusy(key);
    try {
      await fn();
      toast.success(message);
    } catch {
      toast.error("Update failed");
    } finally {
      setBusy(null);
    }
  };

  const slotTime = (iso: string, tz: string) =>
    new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: tz || "America/Chicago",
    }).format(new Date(iso));

  return (
    <div className="space-y-6">
      {/* Stage summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {counts.map(({ stage, count }) => (
          <button
            key={stage}
            type="button"
            onClick={() => setStageFilter(stageFilter === stage ? "ALL" : stage)}
            className={`border p-4 text-left transition-colors ${
              stageFilter === stage
                ? "border-[#FF3333] bg-[#FF3333]/10"
                : "border-white/10 bg-white/[0.02] hover:border-white/30"
            }`}
          >
            <span className="font-mono text-[9px] tracking-widest text-white/40">
              {STAGE_LABELS[stage]}
            </span>
            <p className="mt-1 font-display text-2xl text-white">{count}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <button
          type="button"
          onClick={() => setStageFilter("ALL")}
          className={`px-3 py-1.5 font-mono text-[10px] tracking-widest transition-colors ${
            stageFilter === "ALL"
              ? "bg-[#FF3333] font-bold text-black"
              : "border border-white/10 text-white/60 hover:border-white/30 hover:text-white"
          }`}
        >
          ALL LEADS ({leads.length})
        </button>
        <div className="relative w-full max-w-xs sm:w-auto">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search leads..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border border-white/10 bg-white/[0.02] py-1.5 pl-9 pr-3 font-mono text-xs text-white placeholder:text-white/30 focus:border-[#FF3333] focus:outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-white/10 py-16 text-center">
          <Users className="mx-auto size-8 text-white/20" />
          <p className="mt-3 font-mono text-xs text-white/40">No leads in this view yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((lead) => {
            const upcoming = lead.bookings.filter((b) => b.status === "scheduled");
            const openFollowups = lead.followups.filter((f) => f.status === "open");

            return (
              <div
                key={lead.id}
                className="border border-white/10 bg-white/[0.01] p-5 transition-colors hover:border-white/20"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-xl uppercase tracking-wide text-white">
                        {lead.full_name}
                      </span>
                      <span
                        className={`border px-2 py-0.5 font-mono text-[9px] tracking-widest ${
                          STAGE_COLOR[lead.stage] ?? STAGE_COLOR["new"]
                        }`}
                      >
                        {STAGE_LABELS[lead.stage] ?? lead.stage.toUpperCase()}
                      </span>
                      <span className="border border-white/10 px-2 py-0.5 font-mono text-[9px] tracking-widest text-white/40">
                        {lead.source.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-white/60">
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}`}
                          className="inline-flex items-center gap-1.5 hover:text-white"
                        >
                          <Mail className="size-3 text-[#FF3333]" />
                          {lead.email}
                        </a>
                      )}
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="inline-flex items-center gap-1.5 hover:text-white"
                        >
                          <Phone className="size-3 text-[#FF3333]" />
                          {lead.phone}
                        </a>
                      )}
                      {lead.website_url && (
                        <span className="inline-flex items-center gap-1.5">
                          <Globe className="size-3 text-[#FF3333]" />
                          {lead.website_url}
                        </span>
                      )}
                      <span>{date(lead.created_at)}</span>
                    </div>

                    <p className="mt-2 font-mono text-xs text-white/50">
                      {lead.project_type.replace(/_/g, " ")}
                      {lead.budget_range ? ` · ${lead.budget_range.replace(/_/g, " ")}` : ""}
                      {lead.timeline ? ` · ${lead.timeline}` : ""}
                    </p>
                    {lead.primary_goal && (
                      <p className="mt-2 max-w-2xl font-mono text-xs leading-relaxed text-white/70">
                        {lead.primary_goal}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-[10px] tracking-widest text-white/40">
                      NEXT ACTION
                    </span>
                    <p className="mt-1 inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#FF3333]">
                      <ArrowRight className="size-3" />
                      {nextAction(lead)}
                    </p>
                  </div>
                </div>

                {/* Linked bookings */}
                {upcoming.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                    {upcoming.map((b) => (
                      <div
                        key={b.id}
                        className="flex flex-wrap items-center justify-between gap-3 border border-white/10 bg-white/[0.02] px-3 py-2"
                      >
                        <span className="inline-flex items-center gap-2 font-mono text-xs text-white/80">
                          <CalendarClock className="size-3.5 text-[#FF3333]" />
                          {slotTime(b.slot_start, b.time_zone)} ({b.time_zone})
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={busy === b.id}
                            onClick={() =>
                              run(
                                b.id,
                                () => onUpdateBooking(b.id, "completed"),
                                "Call marked complete",
                              )
                            }
                            className="border border-white/15 px-2.5 py-1 font-mono text-[10px] tracking-widest text-white/70 transition-colors hover:border-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                          >
                            COMPLETED
                          </button>
                          <button
                            type="button"
                            disabled={busy === b.id}
                            onClick={() =>
                              run(b.id, () => onUpdateBooking(b.id, "no_show"), "Marked no-show")
                            }
                            className="border border-white/15 px-2.5 py-1 font-mono text-[10px] tracking-widest text-white/70 transition-colors hover:border-amber-400 hover:text-amber-300 disabled:opacity-50"
                          >
                            NO-SHOW
                          </button>
                          <button
                            type="button"
                            disabled={busy === b.id}
                            onClick={() =>
                              run(b.id, () => onUpdateBooking(b.id, "cancelled"), "Booking cancelled")
                            }
                            className="border border-white/15 px-2.5 py-1 font-mono text-[10px] tracking-widest text-white/70 transition-colors hover:border-[#FF3333] hover:text-[#FF3333] disabled:opacity-50"
                          >
                            CANCEL
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Open followups */}
                {openFollowups.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {openFollowups.map((f) => (
                      <div
                        key={f.id}
                        className="flex flex-wrap items-center justify-between gap-3 border border-amber-400/20 bg-amber-400/[0.04] px-3 py-2"
                      >
                        <span className="inline-flex items-start gap-2 font-mono text-xs text-white/80">
                          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-300" />
                          <span>
                            <strong className="text-amber-300">{f.urgency.toUpperCase()}</strong> ·{" "}
                            {f.reason} — {f.summary}
                          </span>
                        </span>
                        <button
                          type="button"
                          disabled={busy === f.id}
                          onClick={() =>
                            run(f.id, () => onResolveFollowup(f.id, "resolved"), "Follow-up resolved")
                          }
                          className="border border-white/15 px-2.5 py-1 font-mono text-[10px] tracking-widest text-white/70 transition-colors hover:border-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                        >
                          RESOLVE
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Audits */}
                {lead.audits.length > 0 && (
                  <p className="mt-3 font-mono text-[11px] text-white/50">
                    Audit requests: {lead.audits.map((a) => `${a.website_url} (${a.status})`).join(", ")}
                  </p>
                )}

                {/* Stage control */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
                  <span className="font-mono text-[10px] tracking-widest text-white/50">STAGE:</span>
                  <select
                    value={lead.stage}
                    disabled={busy === lead.id}
                    onChange={(e) =>
                      run(lead.id, () => onUpdateStage(lead.id, e.target.value), "Stage updated")
                    }
                    className="border border-white/15 bg-[#030014] px-2.5 py-1 font-mono text-xs text-white focus:border-[#FF3333] focus:outline-none"
                  >
                    {LEAD_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {STAGE_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  {!LEAD_STAGES.includes(lead.stage as (typeof LEAD_STAGES)[number]) && (
                    <span className="font-mono text-[10px] text-white/40">
                      (current: {lead.stage})
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
