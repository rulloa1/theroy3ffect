import { describe, expect, it } from "vitest";
import { PRICING_TIERS } from "@/lib/commerce-catalog";
import {
  DEPOSIT_RATE,
  EXTRA_PAGE_PRICE,
  MIN_DAYS,
  PROJECT_TYPES,
  calculateScopeEstimate,
  getProjectType,
} from "@/lib/scope-estimate";

const estimate = (typeId: string, pageCount = 0, featureIds: string[] = []) =>
  calculateScopeEstimate({ typeId, pageCount, featureIds });

describe("calculateScopeEstimate", () => {
  it("quotes a full website at its base price with a 50% deposit", () => {
    const result = estimate("full_website");
    expect(result.totalPrice).toBe(5000);
    expect(result.depositPrice).toBe(2500);
    expect(result.timelineLabel).toBe("3–4 Weeks");
  });

  it("adds each selected feature's price and days", () => {
    const result = estimate("full_website", 0, ["webgl_3d", "seo_copy"]);
    expect(result.totalPrice).toBe(5000 + 1000 + 750);
    expect(result.days).toBe(18 + 4 + 2);
  });

  it("charges per page beyond the included count, and never past the maximum", () => {
    const withTwoExtra = estimate("full_website", 7);
    expect(withTwoExtra.totalPrice).toBe(5000 + 2 * EXTRA_PAGE_PRICE);
    // Whole days: 2 extra pages is 3 days, not 3.0000001 rendered as a fraction.
    expect(withTwoExtra.days).toBe(21);
    expect(Number.isInteger(withTwoExtra.days)).toBe(true);

    const beyondMax = estimate("full_website", 99);
    expect(beyondMax.totalPrice).toBe(5000 + 10 * EXTRA_PAGE_PRICE);
  });

  it("shows a shorter timeline when rush delivery is paid for", () => {
    // The whole point of the add-on: if the label doesn't move, the $1,500 buys
    // the client nothing they can see.
    const standard = estimate("landing_page");
    const rushed = estimate("landing_page", 0, ["rush_delivery"]);
    expect(rushed.totalPrice).toBeGreaterThan(standard.totalPrice);
    expect(rushed.days).toBeLessThan(standard.days);
    expect(rushed.timelineLabel).not.toBe(standard.timelineLabel);
  });

  it("floors the timeline instead of quoting a same-week delivery", () => {
    const result = estimate("brand_identity", 0, ["rush_delivery"]);
    expect(result.days).toBe(MIN_DAYS);
  });

  it("ignores per-project add-ons on the retainer", () => {
    const result = estimate("retainer", 0, ["webgl_3d", "brand_bundle"]);
    expect(result.totalPrice).toBe(3000);
    expect(result.timelineLabel).toBe("Monthly (Continuous)");
  });

  it("falls back to the default type for an unknown id", () => {
    expect(getProjectType("nope").id).toBe("full_website");
  });

  it("takes half the total as the deposit", () => {
    const result = estimate("design_build");
    expect(result.depositPrice).toBe(result.totalPrice * DEPOSIT_RATE);
  });
});

describe("estimator prices match the published catalog", () => {
  const priceOf = (name: string) => {
    const tier = PRICING_TIERS.find((t) => t.name === name);
    if (!tier) throw new Error(`No catalog tier named ${name}`);
    return Number(tier.price.replace(/[^0-9]/g, ""));
  };

  it.each([
    ["brand_identity", "BRAND SPRINT"],
    ["full_website", "WEBSITE / UI-UX"],
    ["design_build", "DESIGN + BUILD"],
    ["retainer", "RETAINER"],
  ])("%s is quoted at the %s tier price", (typeId, tierName) => {
    const type = PROJECT_TYPES.find((t) => t.id === typeId);
    expect(type?.basePrice).toBe(priceOf(tierName));
  });
});
