/**
 * Shared helpers for the public (unauthenticated) HTTP endpoints under
 * `src/routes/api/public`. These routes are reachable by anyone, so the
 * secret comparison they gate on lives here once rather than being restated
 * per route.
 */

/** JSON response with the header every handler here was setting by hand. */
export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * Compare two secrets without leaking their contents through timing.
 *
 * A plain `a !== b` short-circuits at the first differing character, so the
 * time it takes to reject a guess reveals how much of the prefix was right —
 * enough to recover a token byte by byte. This always walks the full string.
 *
 * Length is not secret (it is fixed per token), so returning early on a length
 * mismatch is fine, and it keeps the comparison well-defined.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Authorize a pg_cron call to one of the scheduled automation endpoints.
 *
 * The shared token lives server-side in `private.automation_config` and is
 * read back through the `automation_cron_token` RPC. Returns `null` when the
 * caller is authorized, or the `Response` to return when it is not.
 */
export async function requireAutomationToken(request: Request): Promise<Response | null> {
  const provided = request.headers.get("x-automation-token") ?? "";
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabaseAdmin as any;

  const { data: expected } = await db.rpc("automation_cron_token");
  if (!expected || !timingSafeEqual(provided, String(expected))) {
    return json({ error: "Unauthorized" }, 401);
  }
  return null;
}

export interface RateLimitRule {
  /** Requests allowed per window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

/**
 * The caller's IP as the edge reports it. Cloudflare sits in front of this app,
 * so `cf-connecting-ip` is the trustworthy one; the rest are fallbacks for
 * local runs. Only the first hop of `x-forwarded-for` is meaningful, and even
 * that is client-supplied, which is why it comes last.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  // `"".split(",")[0].trim()` is "" — not nullish — so this needs `||`, not `??`,
  // or every header-less request shares one bucket and locks the endpoint.
  const firstHop = forwarded.split(",")[0]?.trim();
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    (firstHop || "unknown")
  );
}

/**
 * Throttle an unauthenticated endpoint. Returns `null` when the request may
 * proceed, or the `Response` to return when it may not.
 *
 * `scope` names the counter; pass an IP-scoped rule to slow one abuser down and
 * a shared rule (scope without an IP) to cap the endpoint's total cost.
 *
 * Deliberately fails open: if the limiter itself errors, a real enquiry still
 * gets through. A missed limit costs an email; a dropped lead costs a client.
 */
export async function requireRateLimit(
  scope: string,
  rule: RateLimitRule,
): Promise<Response | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabaseAdmin as any;

    const { data, error } = await db.rpc("rate_limit_hit", {
      p_bucket: scope,
      p_limit: rule.limit,
      p_window_seconds: rule.windowSeconds,
    });

    if (error) {
      console.error("Rate limit check failed (allowing request):", error.message);
      return null;
    }

    if (data === false) {
      return json({ error: "Too many requests. Please try again later." }, 429);
    }
    return null;
  } catch (err) {
    // supabaseAdmin throws when its env vars are missing, and the whole point
    // of this helper is that it never costs a real enquiry.
    console.error("Rate limit check threw (allowing request):", err);
    return null;
  }
}
