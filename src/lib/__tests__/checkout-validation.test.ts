import { describe, expect, it } from "vitest";
import {
  assertValidPriceId,
  assertValidPriceIds,
  assertValidSessionId,
  clampQuantity,
} from "@/lib/checkout-validation";

describe("checkout priceId validation", () => {
  it("accepts every catalog-style lookup key", () => {
    for (const id of [
      "deposit_brand_sprint_onetime",
      "website_uiux_full_onetime",
      "retainer_monthly",
      "addon_rush_delivery_onetime",
    ]) {
      expect(() => assertValidPriceId(id)).not.toThrow();
    }
  });

  it("rejects empty and malformed price ids", () => {
    for (const bad of ["", "price id", "price/id", "price.id", "price?id=1", "😀"]) {
      expect(() => assertValidPriceId(bad)).toThrow("Invalid priceId");
    }
  });

  it("rejects a single bad add-on id within a valid list", () => {
    expect(() => assertValidPriceIds(["addon_revision_round_onetime", "bad id"])).toThrow(
      "Invalid addOnPriceId",
    );
    expect(() =>
      assertValidPriceIds(["addon_revision_round_onetime", "addon_rush_delivery_onetime"]),
    ).not.toThrow();
  });
});

describe("checkout session id validation", () => {
  it("accepts Stripe checkout session ids", () => {
    expect(() => assertValidSessionId("cs_test_a1B2c3")).not.toThrow();
    expect(() => assertValidSessionId("cs_live_XyZ_123")).not.toThrow();
  });

  it("rejects non-session ids and injection attempts", () => {
    for (const bad of ["", "pi_123", "cs_", "cs_test_../admin", "cs test"]) {
      expect(() => assertValidSessionId(bad)).toThrow("Invalid session id");
    }
  });
});

describe("quantity clamping", () => {
  it("defaults to 1 when omitted", () => {
    expect(clampQuantity(undefined)).toBe(1);
  });

  it("clamps below 1 and above 10", () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(-5)).toBe(1);
    expect(clampQuantity(11)).toBe(10);
    expect(clampQuantity(1000)).toBe(10);
  });

  it("truncates fractional quantities", () => {
    expect(clampQuantity(2.9)).toBe(2);
  });
});
