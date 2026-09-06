import { createFileRoute } from "@tanstack/react-router";
import { json, timingSafeEqual } from "@/lib/http/public-endpoint";

interface VapiToolCall {
  id?: string;
  function?: { name?: string; arguments?: unknown };
  name?: string;
  arguments?: unknown;
}

function parseArgs(raw: unknown): unknown {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw ?? {};
}

export const Route = createFileRoute("/api/public/vapi")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["VAPI_SERVER_SECRET"];
        if (!secret) {
          console.error("VAPI_SERVER_SECRET is not configured");
          return json({ error: "Server not configured" }, 500);
        }

        const provided =
          request.headers.get("x-vapi-secret") ??
          request.headers.get("x-vapi-signature") ??
          (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");

        if (!provided || !timingSafeEqual(provided, secret)) {
          return json({ error: "Unauthorized" }, 401);
        }

        let payload: any;
        try {
          payload = await request.json();
        } catch {
          return json({ error: "Invalid request body" }, 400);
        }

        const message = payload?.message ?? payload;
        const callId: string | null = message?.call?.id ?? payload?.call?.id ?? null;

        const toolCalls: VapiToolCall[] =
          message?.toolCallList ??
          message?.toolCalls ??
          message?.tool_calls ??
          (message?.functionCall ? [{ id: message?.id, function: message.functionCall }] : []);

        if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
          // Non-tool server events (status updates, end-of-call reports) are stored, not executed.
          const { recordCallEvent } = await import("@/lib/vapi/handlers.server");
          await recordCallEvent(message, callId);
          return json({ ok: true });
        }


        const { runTool, logToolCall } = await import("@/lib/vapi/handlers.server");

        const results = await Promise.all(
          toolCalls.map(async (call) => {
            const name = call.function?.name ?? call.name ?? "";
            const args = parseArgs(call.function?.arguments ?? call.arguments);
            try {
              const result = await runTool(name, args, callId);
              await logToolCall({ callId, toolName: name, request: args, result, ok: true });
              return { toolCallId: call.id ?? name, result: JSON.stringify(result) };
            } catch (error) {
              const messageText = error instanceof Error ? error.message : "Unexpected error";
              console.error(`Vapi tool ${name} failed:`, error);
              await logToolCall({
                callId,
                toolName: name,
                request: args,
                result: {},
                ok: false,
                errorMessage: messageText,
              });
              return {
                toolCallId: call.id ?? name,
                result: JSON.stringify({
                  status: "error",
                  message: "I couldn't complete that just now — a human will follow up.",
                }),
              };
            }
          }),
        );

        return json({ results });
      },
    },
  },
});
