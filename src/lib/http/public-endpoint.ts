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
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}
