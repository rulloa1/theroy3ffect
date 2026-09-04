import { createFileRoute } from "@tanstack/react-router";
import { requireAutomationToken } from "@/lib/http/public-endpoint";

/**
 * Scheduled entry point for the prospect → CRM sync.
 * Called by pg_cron with the shared token stored server-side in private.automation_config.
 * Advances prospects to meeting/won based on discovery bookings and paid orders.
 */
export const Route = createFileRoute("/api/public/automation/prospect-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await requireAutomationToken(request);
        if (denied) return denied;

        try {
          const { syncProspectCrm } = await import("@/lib/prospecting/crm.server");
          const result = await syncProspectCrm();
          return Response.json({ ok: true, ...result });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Sync failed";
          return Response.json({ ok: false, error: message }, { status: 500 });
        }
      },
    },
  },
});
