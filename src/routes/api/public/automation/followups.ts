import { createFileRoute } from "@tanstack/react-router";
import { requireAutomationToken } from "@/lib/http/public-endpoint";

/**
 * Scheduled entry point for the follow-up autopilot.
 * Called by pg_cron with a shared token stored server-side in private.automation_config.
 * The handler is bounded, single-flight, idempotent, and self-pausing on billing blocks.
 */
export const Route = createFileRoute("/api/public/automation/followups")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await requireAutomationToken(request);
        if (denied) return denied;

        const { runFollowupBatch } = await import("@/lib/automation/followups.server");
        const result = await runFollowupBatch("cron");

        // Safety net: set up any paid purchase the webhook could not finish.
        let onboarding = { processed: 0 };
        try {
          const { processPendingOnboarding } = await import("@/lib/automation/onboarding.server");
          onboarding = await processPendingOnboarding();
        } catch (error) {
          console.error("[onboarding] scheduled sweep failed:", error);
        }

        return Response.json({ ...result, onboarding }, { status: result.ok ? 200 : 500 });
      },
    },
  },
});
