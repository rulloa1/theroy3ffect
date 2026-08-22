/**
 * Browser-side Sentry bootstrap.
 *
 * The SDK is imported dynamically so that projects without a DSN configured
 * (and the initial page load in general) never pay for the bundle.
 */
import {
  getClientEnvironment,
  getClientRelease,
  tracesSampleRateFor,
  type AppEnvironment,
} from "./env";

type SentryModule = typeof import("@sentry/react");

let sentryPromise: Promise<SentryModule | null> | undefined;

function getDsn(): string | undefined {
  const dsn = import.meta.env["VITE_SENTRY_DSN"] as string | undefined;
  return dsn && dsn.length > 0 ? dsn : undefined;
}

export function isSentryClientEnabled(): boolean {
  return typeof window !== "undefined" && Boolean(getDsn());
}

export function initSentryClient(): Promise<SentryModule | null> {
  if (sentryPromise) return sentryPromise;

  const dsn = getDsn();
  if (typeof window === "undefined" || !dsn) {
    sentryPromise = Promise.resolve(null);
    return sentryPromise;
  }

  const environment: AppEnvironment = getClientEnvironment();

  sentryPromise = import("@sentry/react")
    .then((Sentry) => {
      Sentry.init({
        dsn,
        environment,
        release: getClientRelease(),
        sendDefaultPii: false,
        tracesSampleRate: tracesSampleRateFor(environment),
        integrations: [Sentry.browserTracingIntegration()],
        ignoreErrors: [
          "ResizeObserver loop limit exceeded",
          "ResizeObserver loop completed with undelivered notifications.",
          /^Non-Error promise rejection captured/,
        ],
      });
      return Sentry;
    })
    .catch(() => null);

  return sentryPromise;
}

/** Report a handled/boundary error from the browser. */
export function captureClientError(error: unknown, context?: Record<string, unknown>): void {
  if (!isSentryClientEnabled()) return;
  void initSentryClient().then((Sentry) => {
    Sentry?.captureException(error, context ? { extra: context } : undefined);
  });
}
