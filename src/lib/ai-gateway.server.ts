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

/** Direct Google Gemini provider via its OpenAI-compatible endpoint. */
export function createGeminiProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "gemini",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    apiKey,
  });
}

/**
 * Resolves the AI provider for drafting jobs. Prefers the owner's
 * GOOGLE_API_KEY (direct Gemini, no credit usage); falls back to the
 * Lovable AI Gateway when the key is absent.
 */
export function resolveDraftingProvider(): {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider: (model: string) => any;
  model: string;
  source: "google" | "lovable";
} {
  const googleKey = process.env["GOOGLE_API_KEY"];
  if (googleKey) {
    return {
      provider: createGeminiProvider(googleKey),
      model: "gemini-2.5-flash",
      source: "google",
    };
  }
  const lovableKey = process.env["LOVABLE_API_KEY"];
  if (!lovableKey) throw new Error("Missing GOOGLE_API_KEY and LOVABLE_API_KEY");
  return {
    provider: createLovableAiGatewayProvider(lovableKey),
    model: "google/gemini-3-flash-preview",
    source: "lovable",
  };
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
