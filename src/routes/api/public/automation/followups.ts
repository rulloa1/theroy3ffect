import { createFileRoute } from "@tanstack/react-router";

/**
 * Scheduled entry point for the follow-up autopilot.
 * Called by pg_cron with a shared token stored server-side in private.automation_config.
 * The handler is bounded, single-flight, idempotent, and self-pausing on billing blocks.
 */
export const Route = createFileRoute("/api/public/automation/followups")({
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

        const { runFollowupBatch } = await import("@/lib/automation/followups.server");
        const result = await runFollowupBatch("cron");
        return Response.json(result, { status: result.ok ? 200 : 500 });
      },
    },
  },
});
