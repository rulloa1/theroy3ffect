import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * The slice of `requireSupabaseAuth`'s context this guard needs: the
 * caller-scoped Supabase client and the user id taken from their verified JWT.
 */
export interface AdminContext {
  supabase: SupabaseClient<Database>;
  userId: string;
}

/**
 * Throw unless the authenticated caller holds the `admin` role.
 *
 * `requireSupabaseAuth` only proves *someone* is signed in — portal clients
 * have accounts too — so every server function that reaches for the
 * service-role client (which bypasses RLS) must call this first.
 *
 * The lookup runs on the caller-scoped client and fails closed: a query error
 * leaves `data` null and denies the request.
 */
export async function assertAdmin(context: AdminContext): Promise<void> {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}
