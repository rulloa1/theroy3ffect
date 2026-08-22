import { RefreshCw, TrendingUp } from "lucide-react";
import type { FunnelStats, ProspectAnalytics } from "@/utils/prospects.functions";

export interface ProspectAnalyticsPanelProps {
  analytics: ProspectAnalytics | undefined;
  busy: string | null;
  onSync: () => Promise<void>;
}

const money = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const rate = (part: number, whole: number) => (whole === 0 ? "—" : `${Math.round((part / whole) * 100)}%`);

function StatTable({ title, rows, hint }: { title: string; rows: FunnelStats[]; hint: string }) {
  return (
    <div className="border border-white/10 bg-white/[0.02] p-5">
      <p className="font-mono text-xs tracking-widest text-white">{title}</p>
      <p className="mt-1 font-mono text-[10px] text-white/40">{hint}</p>
      {rows.length === 0 ? (
        <p className="mt-4 font-mono text-[10px] text-white/40">No sends recorded yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse">
            <thead>
              <tr className="font-mono text-[10px] tracking-widest text-white/40">
                {["", "SENT", "OPENED", "REPLIED", "CALLS", "WON", "REVENUE"].map((h) => (
                  <th key={h} className="border-b border-white/10 pb-2 text-left font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="font-mono text-xs text-white/70">
                  <td className="border-b border-white/5 py-2 pr-4 text-white">{row.label}</td>
                  <td className="border-b border-white/5 py-2">{row.sent}</td>
                  <td className="border-b border-white/5 py-2">
                    {row.opened}{" "}
                    <span className="text-white/30">{rate(row.opened, row.sent)}</span>
                  </td>
                  <td className="border-b border-white/5 py-2">
                    {row.replied}{" "}
                    <span className="text-white/30">{rate(row.replied, row.sent)}</span>
                  </td>
                  <td className="border-b border-white/5 py-2">{row.booked}</td>
                  <td className="border-b border-white/5 py-2">{row.won}</td>
                  <td className="border-b border-white/5 py-2 text-emerald-300">
                    {row.revenueCents ? money(row.revenueCents) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ProspectAnalyticsPanel({ analytics, busy, onSync }: ProspectAnalyticsPanelProps) {
  const overall = analytics?.overall;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="mt-0.5 size-5 text-[#FF3333]" />
          <div>
            <p className="font-mono text-xs tracking-widest text-white">OUTREACH PERFORMANCE</p>
            <p className="mt-1 max-w-lg font-mono text-[10px] leading-relaxed text-white/40">
              An open means the prospect viewed their personalized report. Calls and revenue are matched back
              from your booking calendar and paid orders by email.
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={busy !== null}
          onClick={onSync}
          className="flex items-center gap-2 border border-white/10 px-4 py-2 font-mono text-[10px] tracking-widest text-white/70 hover:text-white disabled:opacity-40"
        >
          <RefreshCw className="size-3" />
          {busy === "sync-crm" ? "SYNCING…" : "SYNC WITH CRM"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["EMAILS SENT", String(overall?.sent ?? 0)],
          ["REPORTS OPENED", `${overall?.opened ?? 0} (${rate(overall?.opened ?? 0, overall?.sent ?? 0)})`],
          ["CALLS BOOKED", String(overall?.booked ?? 0)],
          ["REVENUE", money(overall?.revenueCents ?? 0)],
        ].map(([label, value]) => (
          <div key={label} className="border border-white/10 bg-white/[0.02] p-4">
            <span className="font-mono text-[10px] tracking-widest text-white/40">{label}</span>
            <p className="mt-2 font-display text-3xl text-white">{value}</p>
          </div>
        ))}
      </div>

      <StatTable
        title="A/B VARIANTS"
        hint="Which subject line and opening angle earns replies."
        rows={analytics?.byVariant ?? []}
      />
      <StatTable
        title="BY PAIN SCORE"
        hint="Which severity band actually turns into paying work."
        rows={analytics?.byPainBand ?? []}
      />
      <StatTable
        title="BY INDUSTRY"
        hint="Where to point the finder next."
        rows={analytics?.byIndustry ?? []}
      />
    </div>
  );
}
