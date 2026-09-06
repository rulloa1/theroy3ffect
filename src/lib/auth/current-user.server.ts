import { getRequest } from "@tanstack/react-start/server";

/**
 * Read the caller's bearer token from the current request, if there is one.
 *
 * `attachSupabaseAuth` is registered as a global client middleware in
 * `src/start.ts`, so every server-function call from a signed-in browser
 * carries this header; anonymous callers simply omit it.
 */
function bearerToken(): string | null {
  const authHeader = getRequest()?.headers?.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  // A Supabase access token is a three-part JWT; anything else is not worth
  // a round trip to the auth server.
  return token && token.split(".").length === 3 ? token : null;
}

/**
 * Resolve the signed-in user's id from their verified access token, or null
 * when the caller is anonymous or the token does not check out.
 *
 * This is the optional counterpart to the `requireSupabaseAuth` middleware,
 * for endpoints that must stay reachable by logged-out visitors but still
 * need to know who the caller is when they are signed in. Use it instead of
 * letting the client name its own user id: a value that arrives in the
 * request body is a claim, not a fact.
 */
export async function getOptionalUserId(): Promise<string | null> {
  const token = bearerToken();
  if (!token) return null;

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Validates the JWT's signature and expiry against the auth server.
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error) return null;
    return data.user?.id ?? null;
  } catch {
    // Never let identity resolution break an otherwise valid anonymous flow.
    return null;
  }
}
