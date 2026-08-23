import { sendTemplateEmail } from "@/lib/email-templates/send-email";
import { OWNER_EMAIL } from "@/utils/booking.server";

/**
 * Search Console index watch.
 * Every run re-reads URL Inspection data for the watched guide URLs through
 * the linked Search Console connection and emails the owner when a URL moves
 * up the discoverability ladder (unknown -> discovered/crawled -> indexed).
 *
 * Job-safety rules: bounded work (fixed URL list), single-flight lease,
 * idempotent per-URL state, circuit breaker on 401/402/403, park on 429.
 */
export const JOB_KEY = "gsc_index_watch";
const LEASE_MINUTES = 5;
const SITE_TARGET = "https://www.theroyeffect.com/";
const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";

export const WATCHED_URLS = [
  "https://www.theroyeffect.com/guides/website-audit-checklist",
  "https://www.theroyeffect.com/guides/houston-website-cost",
  "https://www.theroyeffect.com/guides/squarespace-vs-custom-website",
] as const;

/** Discoverability ladder used to decide when an alert is worth sending. */
export function rankIndexState(verdict: string, coverageState: string): number {
  if (verdict === "PASS") return 2; // indexed
  const c = coverageState.toLowerCase();
  if (c.includes("crawled") || c.includes("discovered")) return 1; // known to Google
  return 0; // unknown / excluded
}

export const RANK_LABELS = [
  "Not known to Google yet",
  "Discovered by Google (not indexed yet)",
  "Indexed and discoverable in Search",
] as const;

interface UrlState {
  verdict: string;
  coverageState: string;
  rank: number;
  lastCheckedAt: string;
  alertedAt: string | null;
}

type JobState = { urls?: Record<string, UrlState> };

class GscApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabaseAdmin as any;
}

function gatewayHeaders() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["GOOGLE_SEARCH_CONSOLE_API_KEY"];
  if (!lovableKey) throw new Error("Missing LOVABLE_API_KEY");
  if (!connectionKey) {
    throw new Error(
      "Missing GOOGLE_SEARCH_CONSOLE_API_KEY — link the Search Console connection to this project.",
    );
  }
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": connectionKey,
    "Content-Type": "application/json",
  };
}

async function gscFetch(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: { ...gatewayHeaders(), ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new GscApiError(response.status, `Search Console request failed [${response.status}]: ${body}`);
  }
  return response.json();
}

function coversTarget(siteUrl: string, target: URL) {
  if (siteUrl.startsWith("sc-domain:")) {
    const domain = siteUrl.slice("sc-domain:".length).toLowerCase();
    const host = target.hostname.toLowerCase();
    return host === domain || host.endsWith(`.${domain}`);
  }
  try {
    return target.href.startsWith(new URL(siteUrl).href);
  } catch {
    return false;
  }
}

/** Resolves the verified property for the site at runtime; never hardcodes one. */
async function resolveSiteUrl(): Promise<string> {
  const data = (await gscFetch("/webmasters/v3/sites")) as {
    siteEntry?: { siteUrl: string; permissionLevel?: string }[];
  };
  const target = new URL(SITE_TARGET);
  const matches = (data.siteEntry ?? []).filter(
    (entry) => entry.permissionLevel !== "siteUnverifiedUser" && coversTarget(entry.siteUrl, target),
  );
  if (matches.length === 0) {
    throw new Error("No verified Search Console property covers www.theroyeffect.com");
  }
  const exact = matches.find((entry) => entry.siteUrl === SITE_TARGET);
  const chosen = exact ?? (matches.length === 1 ? matches[0] : undefined);
  if (!chosen) {
    throw new Error(
      `Multiple Search Console properties cover the site: ${matches.map((m) => m.siteUrl).join(", ")}`,
    );
  }
  return chosen.siteUrl;
}

interface InspectionResult {
  verdict: string;
  coverageState: string;
  indexingState?: string | undefined;
  lastCrawlTime?: string | undefined;
}

async function inspectUrl(siteUrl: string, url: string): Promise<InspectionResult> {
  const data = (await gscFetch("/v1/urlInspection/index:inspect", {
    method: "POST",
    body: JSON.stringify({ inspectionUrl: url, siteUrl }),
  })) as { inspectionResult?: { indexStatusResult?: Record<string, string> } };
  const r = data.inspectionResult?.indexStatusResult ?? {};
  return {
    verdict: r["verdict"] ?? "",
    coverageState: r["coverageState"] ?? "",
    indexingState: r["indexingState"],
    lastCrawlTime: r["lastCrawlTime"],
  };
}

async function notifyOwner(subjectLine: string, details: Record<string, string | undefined>) {
  // Mirror every alert to Slack; email remains the primary channel.
  const { postSlackAlert } = await import("@/lib/slack/notify.server");
  await postSlackAlert(subjectLine, details);
  try {
    await sendTemplateEmail("voice-agent-notification", OWNER_EMAIL, {
      templateData: { subjectLine, details },
      idempotencyKey: `gsc-watch-${crypto.randomUUID()}`,
    });
  } catch (error) {
    console.error("[gsc-index-watch] owner notification failed:", error);
  }
}

export interface IndexWatchResult {
  ok: boolean;
  status: "completed" | "paused" | "skipped_locked" | "skipped_paused" | "failed";
  checked: number;
  alerts: number;
  message?: string;
}

export async function runIndexWatch(runner: string): Promise<IndexWatchResult> {
  const db = await admin();

  const { data: job } = await db
    .from("automation_jobs")
    .select("*")
    .eq("job_key", JOB_KEY)
    .maybeSingle();
  if (!job) {
    return { ok: false, status: "failed", checked: 0, alerts: 0, message: "Job row missing" };
  }

  const paused = job.status === "paused";
  // Paused: run at most one probe URL to detect out-of-band recovery.
  const urls = paused ? WATCHED_URLS.slice(0, 1) : WATCHED_URLS;

  const now = new Date();
  if (job.lease_expires_at && new Date(job.lease_expires_at).getTime() > now.getTime()) {
    return { ok: true, status: "skipped_locked", checked: 0, alerts: 0 };
  }

  const leaseExpiry = new Date(now.getTime() + LEASE_MINUTES * 60_000).toISOString();
  const { data: leased } = await db
    .from("automation_jobs")
    .update({ lease_owner: runner, lease_expires_at: leaseExpiry, updated_at: now.toISOString() })
    .eq("job_key", JOB_KEY)
    .or(`lease_expires_at.is.null,lease_expires_at.lt.${now.toISOString()}`)
    .select("job_key")
    .maybeSingle();
  if (!leased) return { ok: true, status: "skipped_locked", checked: 0, alerts: 0 };

  const state: JobState = (job.state as JobState) ?? {};
  const urlStates: Record<string, UrlState> = { ...(state.urls ?? {}) };
  let checked = 0;
  let alerts = 0;
  let result: IndexWatchResult = { ok: true, status: "completed", checked: 0, alerts: 0 };

  const fail = async (message: string, pause: boolean) => {
    const update: Record<string, unknown> = {
      last_error: message,
      consecutive_failures: (job.consecutive_failures ?? 0) + 1,
    };
    if (pause) {
      update["status"] = "paused";
      update["paused_reason"] = message;
    }
    await db.from("automation_jobs").update(update).eq("job_key", JOB_KEY);
    // Surface persistent config/billing problems to the owner once per distinct message.
    if (job.last_error !== message) {
      await notifyOwner(
        pause ? "SEO index watch paused" : "SEO index watch failed",
        { Problem: message, "Next step": "Fix the issue, then resume the job from the next scheduled run." },
      );
    }
    return {
      ok: false,
      status: pause ? ("paused" as const) : ("failed" as const),
      checked,
      alerts,
      message,
    };
  };

  try {
    const siteUrl = await resolveSiteUrl();

    for (const url of urls) {
      let inspection: InspectionResult;
      try {
        inspection = await inspectUrl(siteUrl, url);
      } catch (error) {
        if (error instanceof GscApiError && error.status === 429) {
          // Rate limited: park remaining URLs; the next scheduled run retries.
          result = await fail("Search Console rate limited the run — will retry on the next schedule.", false);
          return result;
        }
        throw error;
      }
      checked += 1;

      const rank = rankIndexState(inspection.verdict, inspection.coverageState);
      const previous = urlStates[url];
      const previousRank = previous?.rank ?? 0;
      const checkedAt = new Date().toISOString();
      urlStates[url] = {
        verdict: inspection.verdict || "UNKNOWN",
        coverageState: inspection.coverageState || "URL is unknown to Google",
        rank,
        lastCheckedAt: checkedAt,
        alertedAt: previous?.alertedAt ?? null,
      };

      if (rank > previousRank) {
        alerts += 1;
        urlStates[url].alertedAt = checkedAt;
        await notifyOwner(
          rank === 2 ? `SEO win: guide is now indexed` : `SEO progress: guide discovered by Google`,
          {
            Page: url.replace(SITE_TARGET, "theroyeffect.com/"),
            "New status": `${RANK_LABELS[rank]} — ${inspection.coverageState}`,
            "Previous status": previous ? previous.coverageState : "Unknown",
            "Last crawl": inspection.lastCrawlTime,
          },
        );
      }
    }

    if (paused && checked > 0) {
      // Probe succeeded: clear the pause and resume full runs.
      await db
        .from("automation_jobs")
        .update({ status: "active", paused_reason: null })
        .eq("job_key", JOB_KEY);
    }

    await db.from("automation_jobs").update({ state: { urls: urlStates } }).eq("job_key", JOB_KEY);
    result = {
      ok: true,
      status: paused ? "skipped_paused" : "completed",
      checked,
      alerts,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // 401/402/403 from the gateway are terminal until config changes: pause the job.
    const pause = error instanceof GscApiError && [401, 402, 403].includes(error.status);
    // Persist whatever URL progress was made before the failure.
    await db.from("automation_jobs").update({ state: { urls: urlStates } }).eq("job_key", JOB_KEY);
    result = await fail(message, pause);
  } finally {
    await db
      .from("automation_jobs")
      .update({
        lease_owner: null,
        lease_expires_at: null,
        last_run_at: new Date().toISOString(),
        items_processed: (job.items_processed ?? 0) + checked,
        ...(result.ok ? { consecutive_failures: 0, last_error: null } : {}),
      })
      .eq("job_key", JOB_KEY);
  }

  return result;
}
