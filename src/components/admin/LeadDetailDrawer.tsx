import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import { X, CalendarClock, FileJson, MessageSquare, Loader2 } from "lucide-react";
import { adminGetLeadDetail, type CrmLead } from "@/utils/crm.functions";

interface Props {
  lead: CrmLead | null;
  onClose: () => void;
}

const TZ = (tz: string) => tz || "America/Chicago";

const slotTime = (iso: string, tz: string) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ(tz),
  }).format(new Date(iso));

const stamp = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-US", { timeZone: "America/Chicago" }) : "—";

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="border-t border-white/10 pt-5">
      <h3 className="mb-3 inline-flex items-center gap-2 font-mono text-[10px] tracking-widest text-white/50">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

export function LeadDetailDrawer({ lead, onClose }: Props) {
  const getDetail = useServerFn(adminGetLeadDetail);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-lead-detail", lead?.id],
    queryFn: () => getDetail({ data: { leadId: lead!.id } }),
    enabled: Boolean(lead?.id),
  });

  return (
    <AnimatePresence>
      {lead && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="fixed right-0 top-0 z-[95] flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-[#030014]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
              <div className="min-w-0">
                <span className="font-mono text-[10px] tracking-widest text-[#FF3333]">
                  LEAD DETAIL
                </span>
                <h2 className="truncate font-display text-2xl uppercase text-white">
                  {lead.full_name}
                </h2>
                <p className="mt-1 font-mono text-[11px] text-white/50">
                  {[lead.email, lead.phone, lead.company_name].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close lead detail"
                className="border border-white/15 p-2 text-white/60 transition-colors hover:border-[#FF3333] hover:text-[#FF3333]"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {isLoading && (
                <p className="inline-flex items-center gap-2 font-mono text-xs text-white/50">
                  <Loader2 className="size-3.5 animate-spin" /> Loading call history…
                </p>
              )}

              <Section title="VOICE TRANSCRIPT" icon={<MessageSquare className="size-3.5" />}>
                {(data?.calls ?? []).length === 0 ? (
                  <p className="font-mono text-xs text-white/40">
                    No transcript stored for this lead&apos;s calls yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {data!.calls.map((call) => (
                      <div key={call.id} className="border border-white/10 bg-white/[0.02] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] tracking-widest text-white/40">
                          <span>{call.vapi_call_id}</span>
                          <span>
                            {call.status.toUpperCase()}
                            {call.ended_reason ? ` · ${call.ended_reason}` : ""}
                          </span>
                        </div>
                        <p className="mt-1 font-mono text-[10px] text-white/40">
                          {stamp(call.started_at ?? call.created_at)} → {stamp(call.ended_at)}
                        </p>
                        {call.summary && (
                          <p className="mt-3 font-mono text-xs leading-relaxed text-white/70">
                            {call.summary}
                          </p>
                        )}
                        {call.recording_url && (
                          <audio controls src={call.recording_url} className="mt-3 w-full" />
                        )}
                        {call.transcript ? (
                          <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-white/70">
                            {call.transcript}
                          </pre>
                        ) : (
                          <p className="mt-3 font-mono text-[11px] text-white/40">
                            Transcript not received for this call.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="RAW INTAKE PAYLOAD" icon={<FileJson className="size-3.5" />}>
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-white/60">
                  {JSON.stringify(data?.lead ?? lead, null, 2)}
                </pre>
                {(data?.logs ?? []).length > 0 && (
                  <div className="mt-3 space-y-3">
                    {data!.logs.map((log) => (
                      <div key={log.id} className="border border-white/10 bg-white/[0.02] p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-[11px] text-white/80">
                            {log.tool_name}
                          </span>
                          <span
                            className={`font-mono text-[9px] tracking-widest ${
                              log.ok ? "text-emerald-300" : "text-[#FF3333]"
                            }`}
                          >
                            {log.ok ? "OK" : "FAILED"} · {stamp(log.created_at)}
                          </span>
                        </div>
                        {log.error_message && (
                          <p className="mt-1 font-mono text-[11px] text-[#FF3333]">
                            {log.error_message}
                          </p>
                        )}
                        <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-white/50">
                          {JSON.stringify(
                            { request: log.request_payload, result: log.result_payload },
                            null,
                            2,
                          )}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="ALL BOOKING ATTEMPTS" icon={<CalendarClock className="size-3.5" />}>
                {(data?.bookings ?? lead.bookings).length === 0 ? (
                  <p className="font-mono text-xs text-white/40">No booking attempts recorded.</p>
                ) : (
                  <ul className="space-y-2">
                    {(data?.bookings ?? lead.bookings).map((b) => (
                      <li
                        key={b.id}
                        className="flex flex-wrap items-center justify-between gap-2 border border-white/10 bg-white/[0.02] px-3 py-2 font-mono text-xs text-white/70"
                      >
                        <span>
                          {slotTime(b.slot_start, b.time_zone)} ({b.time_zone})
                        </span>
                        <span className="tracking-widest text-white/40">
                          {b.status.toUpperCase()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
