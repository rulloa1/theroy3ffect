import { createFileRoute } from "@tanstack/react-router";

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
        const provided = request.headers.get("x-automation-token") ?? "";
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = supabaseAdmin as any;

        const { data: expected } = await db.rpc("automation_cron_token");
        if (!expected || provided.length !== String(expected).length || provided !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { runIndexWatch } = await import("@/lib/gsc/index-watch.server");
        const result = await runIndexWatch("cron");
        return Response.json(result, { status: result.ok ? 200 : 500 });
      },
    },
  },
});
