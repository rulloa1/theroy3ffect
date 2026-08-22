import { createFileRoute } from "@tanstack/react-router";

/**
 * Scheduled entry point for the prospect → CRM sync.
 * Called by pg_cron with the shared token stored server-side in private.automation_config.
 * Advances prospects to meeting/won based on discovery bookings and paid orders.
 */
export const Route = createFileRoute("/api/public/automation/prospect-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided = request.headers.get("x-automation-token") ?? "";
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = supabaseAdmin as any;

        const { data: expected } = await db.rpc("automation_cron_token");
        if (!expected || provided.length !== String(expected).length || provided !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

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
