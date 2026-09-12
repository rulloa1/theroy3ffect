import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/utils/require-admin";

export interface OnboardingRun {
  id: string;
  trigger_type: string;
  source_table: string;
  source_id: string;
  client_email: string;
  client_name: string | null;
  product_name: string | null;
  amount_cents: number;
  currency: string;
  project_id: string | null;
  status: string;
  plan: {
    projectTitle?: string;
    summary?: string;
    nextStep?: string;
    kickoffNotes?: string;
    milestones?: { title: string; note: string; dueInDays: number }[];
  } | null;
  rationale: string | null;
  model: string | null;
  welcome_email_sent_at: string | null;
  approved_at: string | null;
  error_message: string | null;
  created_at: string;
}

export const adminListOnboarding = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ runs: OnboardingRun[] }> => {
    await assertAdmin(context as never);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (context as any).supabase;
    const { data } = await db
      .from("onboarding_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    return { runs: (data as OnboardingRun[]) ?? [] };
  });

/** Sets up every purchase still waiting in the queue. */
export const adminRunOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { processPendingOnboarding } = await import("@/lib/automation/onboarding.server");
    return processPendingOnboarding();
  });

const idSchema = z.object({ id: z.string().uuid() });

/** Re-runs the agent for one purchase (after a failure, or to refresh the plan). */
export const adminRetryOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (context as any).supabase;
    await db
      .from("onboarding_runs")
      .update({ status: "pending", error_message: null })
      .eq("id", data.id);
    const { processOnboardingRun } = await import("@/lib/automation/onboarding.server");
    return processOnboardingRun(data.id);
  });

/** Marks the setup as reviewed and accepted by Rory. */
export const adminApproveOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (context as any).supabase;
    const { error } = await db
      .from("onboarding_runs")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDismissOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (context as any).supabase;
    await db.from("onboarding_runs").update({ status: "dismissed" }).eq("id", data.id);
    return { ok: true };
  });
