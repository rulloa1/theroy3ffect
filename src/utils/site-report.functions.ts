import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ProspectSignal } from "@/lib/prospecting/industries";

export interface SiteReport {
  businessName: string;
  industryLabel: string;
  website: string | null;
  hasWebsite: boolean;
  painScore: number;
  signals: ProspectSignal[];
  scannedAt: string | null;
  loadSeconds: number | null;
}

const tokenSchema = z.object({ token: z.string().regex(/^[a-f0-9]{8,64}$/i) });

export const getSiteReport = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => tokenSchema.parse(input))
  .handler(async ({ data }): Promise<SiteReport | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getIndustry } = await import("@/lib/prospecting/industries");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabaseAdmin as any;

    const { data: row } = await db
      .from("prospects")
      .select("id, business_name, industry, website, has_website, pain_score, signals, scanned_at, scan_data")
      .eq("report_token", data.token)
      .maybeSingle();
    if (!row) return null;

    await db
      .from("prospects")
      .update({ report_viewed_at: new Date().toISOString() })
      .eq("id", row.id)
      .is("report_viewed_at", null);

    const loadMs = (row.scan_data as { loadMs?: number } | null)?.loadMs ?? null;

    return {
      businessName: row.business_name as string,
      industryLabel: getIndustry(row.industry as string)?.descriptor ?? "local business",
      website: (row.website as string) ?? null,
      hasWebsite: Boolean(row.has_website),
      painScore: Number(row.pain_score ?? 0),
      signals: ((row.signals as ProspectSignal[]) ?? []).slice().sort((a, b) => b.weight - a.weight),
      scannedAt: (row.scanned_at as string) ?? null,
      loadSeconds: typeof loadMs === "number" ? Number((loadMs / 1000).toFixed(1)) : null,
    };
  });
