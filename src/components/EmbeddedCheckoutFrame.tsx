import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { useCallback, useState } from "react";
import { getStripe } from "@/lib/stripe";

interface EmbeddedCheckoutFrameProps {
  /** Resolves the Stripe client secret. May reject — this component handles it. */
  fetchClientSecret: () => Promise<string>;
}

/**
 * Wraps Stripe's embedded checkout so a failed session creation is visible.
 *
 * `EmbeddedCheckoutProvider` calls `fetchClientSecret` without a `.catch`, so a
 * rejection leaves the iframe unmounted with nothing on screen, and its init
 * effect never retries for the life of the mount. That is what "the client
 * secret times out" looked like: a permanently blank panel whose real cause
 * (a rejected checkout session) surfaced only as an unhandled rejection.
 *
 * Here the rejection is captured, reported, and shown to the buyer, and Retry
 * remounts the provider with a fresh key — the provider cannot recover in place.
 */
export function EmbeddedCheckoutFrame({ fetchClientSecret }: EmbeddedCheckoutFrameProps) {
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const guardedFetch = useCallback(async (): Promise<string> => {
    try {
      return await fetchClientSecret();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Checkout could not be started";
      // Keep the throw so Sentry's unhandled-rejection handler still records it.
      console.error("Embedded checkout could not start:", message);
      setError(message);
      throw err;
    }
  }, [fetchClientSecret]);

  if (error) {
    return (
      <div className="border border-[#FF3333]/40 bg-[#FF3333]/5 p-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[#FF3333]">
          Checkout unavailable
        </p>
        <p className="mt-3 font-mono text-xs text-white/70">{error}</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setAttempt((n) => n + 1);
          }}
          className="mt-5 border border-white/30 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-white/80 hover:border-white/60 hover:text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <EmbeddedCheckoutProvider
      key={attempt}
      stripe={getStripe()}
      options={{ fetchClientSecret: guardedFetch }}
    >
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
}
