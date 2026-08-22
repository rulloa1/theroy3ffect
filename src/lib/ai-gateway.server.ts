import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Server-only: builds the Lovable AI Gateway provider.
 * Never import this from client code.
 */
export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
  });
}

/** Thrown when the gateway refuses the request in a way that must halt a batch job. */
export class AiGatewayBlockedError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AiGatewayBlockedError";
  }
}

/** Extracts an HTTP status from an AI SDK error, when present. */
export function statusFromAiError(error: unknown): number | null {
  const candidate = error as { statusCode?: number; status?: number } | null;
  return candidate?.statusCode ?? candidate?.status ?? null;
}
