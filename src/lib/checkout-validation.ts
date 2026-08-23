// Pure, client-safe validation for the checkout flow. Kept separate from
// payments.functions.ts so server-function modules stay thin wrappers and
// these rules can be regression-tested without booting Stripe.

export const PRICE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
export const SESSION_ID_PATTERN = /^cs_[a-zA-Z0-9_]+$/;

export function assertValidPriceId(priceId: string): void {
  if (!PRICE_ID_PATTERN.test(priceId)) throw new Error("Invalid priceId");
}

export function assertValidPriceIds(priceIds: string[]): void {
  for (const id of priceIds) {
    if (!PRICE_ID_PATTERN.test(id)) throw new Error("Invalid addOnPriceId");
  }
}

export function assertValidSessionId(sessionId: string): void {
  if (!SESSION_ID_PATTERN.test(sessionId)) throw new Error("Invalid session id");
}

/** Quantity is always an integer clamped to 1–10 seats/licenses. */
export function clampQuantity(quantity: number | undefined): number {
  return Math.min(Math.max(Math.trunc(quantity ?? 1), 1), 10);
}
