import { createFileRoute } from "@tanstack/react-router";
import { requireAutomationToken } from "@/lib/http/public-endpoint";

/**
 * Scheduled entry point for the Search Console index watch.
 * Called by pg_cron with a shared token stored server-side in private.automation_config.
 * The handler is bounded (3 fixed URLs), single-flight, idempotent, and self-pausing
 * on Search Console access/billing blocks.
 */
export const Route = createFileRoute("/api/public/automation/gsc-index-watch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await requireAutomationToken(request);
        if (denied) return denied;

        const { runIndexWatch } = await import("@/lib/gsc/index-watch.server");
        const result = await runIndexWatch("cron");
        return Response.json(result, { status: result.ok ? 200 : 500 });
      },
    },
  },
});
