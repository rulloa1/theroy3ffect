/**
 * Shared, environment-agnostic Sentry configuration helpers.
 *
 * Client-visible values come from `import.meta.env.VITE_*`.
 * Server-only values are read lazily from `process.env` inside handlers.
 */

export type AppEnvironment = "development" | "staging" | "production";

export function normalizeEnvironment(value: string | undefined): AppEnvironment {
  if (value === "production") return "production";
  if (value === "staging") return "staging";
  return "development";
}

/** Environment name as seen from the browser bundle. */
export function getClientEnvironment(): AppEnvironment {
  return normalizeEnvironment(
    (import.meta.env["VITE_APP_ENV"] as string | undefined) ??
      (import.meta.env.PROD ? "production" : "development"),
  );
}

/** Release identifier, injected at build time by CI (git sha). */
export function getClientRelease(): string | undefined {
  const release = import.meta.env["VITE_APP_RELEASE"] as string | undefined;
  return release && release.length > 0 ? release : undefined;
}

/**
 * Traces sample rate per environment: full sampling in staging so issues are
 * easy to reproduce, light sampling in production to control quota.
 */
export function tracesSampleRateFor(environment: AppEnvironment): number {
  if (environment === "production") return 0.1;
  if (environment === "staging") return 1;
  return 0;
}
