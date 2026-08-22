/** Aggregates outreach performance: opens, replies, booked calls, revenue. */

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabaseAdmin as any;
}

export interface FunnelStats {
  label: string;
  sent: number;
  opened: number;
  replied: number;
  booked: number;
  won: number;
  revenueCents: number;
}

export interface ProspectAnalytics {
  overall: FunnelStats;
  byVariant: FunnelStats[];
  byPainBand: FunnelStats[];
  byIndustry: FunnelStats[];
  generatedAt: string;
}

const empty = (label: string): FunnelStats => ({
  label,
  sent: 0,
  opened: 0,
  replied: 0,
  booked: 0,
  won: 0,
  revenueCents: 0,
});

export function painBand(score: number): string {
  if (score >= 60) return "60+ (severe)";
  if (score >= 40) return "40-59 (high)";
  if (score >= 20) return "20-39 (moderate)";
  return "0-19 (low)";
}

interface Row {
  contact_email: string | null;
  industry: string;
  pain_score: number;
  sent_variant: string | null;
  contacted_at: string | null;
  report_viewed_at: string | null;
  replied_at: string | null;
  booked_at: string | null;
  won_at: string | null;
}

export async function buildProspectAnalytics(): Promise<ProspectAnalytics> {
  const db = await admin();
  const { data } = await db
    .from("prospects")
    .select(
      "contact_email, industry, pain_score, sent_variant, contacted_at, report_viewed_at, replied_at, booked_at, won_at",
    )
    .not("contacted_at", "is", null)
    .limit(1000);

  const rows = (data ?? []) as Row[];
  const emails = rows.map((r) => r.contact_email?.toLowerCase()).filter(Boolean) as string[];

  const revenueByEmail = new Map<string, number>();
  if (emails.length) {
    const { data: orders } = await db
      .from("orders")
      .select("customer_email, amount_total, amount_refunded, payment_status")
      .in("customer_email", emails)
      .limit(1000);
    for (const o of (orders ?? []) as {
      customer_email: string | null;
      amount_total: number;
      amount_refunded: number;
      payment_status: string;
    }[]) {
      if (!o.customer_email || o.payment_status !== "paid") continue;
      const key = o.customer_email.toLowerCase();
      revenueByEmail.set(key, (revenueByEmail.get(key) ?? 0) + (o.amount_total - (o.amount_refunded ?? 0)));
    }
  }

  const overall = empty("All outreach");
  const buckets: Record<"variant" | "pain" | "industry", Map<string, FunnelStats>> = {
    variant: new Map(),
    pain: new Map(),
    industry: new Map(),
  };

  const bump = (stats: FunnelStats, row: Row, revenue: number) => {
    stats.sent += 1;
    if (row.report_viewed_at) stats.opened += 1;
    if (row.replied_at) stats.replied += 1;
    if (row.booked_at) stats.booked += 1;
    if (row.won_at) stats.won += 1;
    stats.revenueCents += revenue;
  };

  for (const row of rows) {
    const revenue = row.contact_email ? (revenueByEmail.get(row.contact_email.toLowerCase()) ?? 0) : 0;
    bump(overall, row, revenue);
    const keys: [keyof typeof buckets, string][] = [
      ["variant", row.sent_variant ? `Variant ${row.sent_variant}` : "No variant"],
      ["pain", painBand(row.pain_score)],
      ["industry", row.industry],
    ];
    for (const [bucket, key] of keys) {
      const map = buckets[bucket];
      if (!map.has(key)) map.set(key, empty(key));
      bump(map.get(key)!, row, revenue);
    }
  }

  const sorted = (map: Map<string, FunnelStats>) =>
    [...map.values()].sort((a, b) => b.sent - a.sent || a.label.localeCompare(b.label));

  return {
    overall,
    byVariant: sorted(buckets.variant),
    byPainBand: sorted(buckets.pain),
    byIndustry: sorted(buckets.industry),
    generatedAt: new Date().toISOString(),
  };
}
