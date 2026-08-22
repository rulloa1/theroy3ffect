import { discoverBusinesses } from "./discover.server";
import { getIndustry } from "./industries";
import { scanWebsite, scoreProspect } from "./scan.server";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabaseAdmin as any;
}

/** Hard caps so one run can never fan out unbounded. */
export const DISCOVER_LIMIT = 40;
export const SCAN_LIMIT = 20;

export interface RunSummary {
  industry: string;
  found: number;
  added: number;
  scanned: number;
  skippedExisting: number;
}

/** Discovers Houston businesses in one industry, scans their sites, and stores scored prospects. */
export async function runProspectScan(industryKey: string): Promise<RunSummary> {
  const industry = getIndustry(industryKey);
  if (!industry) throw new Error("Unknown industry");
  const db = await admin();

  const found = await discoverBusinesses(industryKey, DISCOVER_LIMIT);

  const { data: existingRows } = await db
    .from("prospects")
    .select("source_ref")
    .in(
      "source_ref",
      found.map((f) => f.sourceRef),
    );
  const existing = new Set<string>((existingRows ?? []).map((r: { source_ref: string }) => r.source_ref));
  const fresh = found.filter((f) => !existing.has(f.sourceRef));

  let scanned = 0;
  const rows: Record<string, unknown>[] = [];

  for (const business of fresh) {
    const shouldScan = Boolean(business.website) && scanned < SCAN_LIMIT;
    const scan = shouldScan ? await scanWebsite(business.website as string) : null;
    if (shouldScan) scanned += 1;

    const { score, signals } = scoreProspect({
      hasWebsite: Boolean(business.website),
      scan: shouldScan ? scan : null,
    });

    // Unscanned sites are parked at score 0 until a later run reaches them.
    const parked = Boolean(business.website) && !shouldScan;

    rows.push({
      source: "osm",
      source_ref: business.sourceRef,
      business_name: business.businessName,
      industry: industryKey,
      category: business.category,
      address: business.address,
      lat: business.lat,
      lon: business.lon,
      phone: business.phone,
      website: business.website,
      contact_email: business.email ?? scan?.foundEmail ?? null,
      has_website: Boolean(business.website),
      pain_score: parked ? 0 : score,
      signals: parked ? [] : signals,
      scan_data: scan ? { ...scan } : {},
      scanned_at: scan ? new Date().toISOString() : null,
    });
  }

  if (rows.length) {
    const { error } = await db.from("prospects").insert(rows);
    if (error) throw new Error(error.message);
  }

  return {
    industry: industryKey,
    found: found.length,
    added: rows.length,
    scanned,
    skippedExisting: found.length - fresh.length,
  };
}

/** Scans prospects that were discovered but never checked (score 0 with a website). */
export async function scanPendingProspects(limit = SCAN_LIMIT): Promise<number> {
  const db = await admin();
  const { data } = await db
    .from("prospects")
    .select("id, website")
    .is("scanned_at", null)
    .not("website", "is", null)
    .limit(limit);

  let done = 0;
  for (const row of (data ?? []) as { id: string; website: string }[]) {
    const scan = await scanWebsite(row.website);
    const { score, signals } = scoreProspect({ hasWebsite: true, scan });
    await db
      .from("prospects")
      .update({
        pain_score: score,
        signals,
        scan_data: { ...scan },
        scanned_at: new Date().toISOString(),
        contact_email: scan.foundEmail ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    done += 1;
  }
  return done;
}
