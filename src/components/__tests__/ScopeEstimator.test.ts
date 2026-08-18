import { describe, it, expect } from "vitest";

const PROJECT_TYPES = [
  { id: "landing_page", name: "Conversion Landing Page", basePrice: 2500, baseDays: 7 },
  { id: "full_website", name: "Full Multi-Page Website", basePrice: 5000, baseDays: 18 },
  { id: "brand_identity", name: "Brand Identity System", basePrice: 1500, baseDays: 5 },
  {
    id: "retainer",
    name: "Monthly Design Retainer",
    basePrice: 4500,
    baseDays: 30,
    isRetainer: true,
  },
];

const FEATURES = [
  { id: "webgl_3d", price: 1000, daysAdded: 4 },
  { id: "seo_copy", price: 750, daysAdded: 2 },
  { id: "rush_delivery", price: 1500, daysAdded: -5 },
];

function calculateScopeEstimate(typeId: string, extraPages: number, selectedFeatureIds: string[]) {
  const typeObj = PROJECT_TYPES.find((t) => t.id === typeId) ?? PROJECT_TYPES[1]!;
  const pagePrice = extraPages * 400;
  const pageDays = Math.ceil(extraPages * 1.5);

  let featuresPrice = 0;
  let featuresDays = 0;

  for (const fId of selectedFeatureIds) {
    const feat = FEATURES.find((f) => f.id === fId);
    if (feat) {
      featuresPrice += feat.price;
      featuresDays += feat.daysAdded;
    }
  }

  const totalPrice = typeObj.basePrice + pagePrice + featuresPrice;
  const totalDays = Math.max(3, typeObj.baseDays + pageDays + featuresDays);
  const depositPrice = Math.round(totalPrice * 0.5);
  const timelineWeeks = (totalDays / 7).toFixed(1);

  return { totalPrice, depositPrice, totalDays, timelineWeeks };
}

describe("ScopeEstimator Calculations", () => {
  it("calculates base price and deposit correctly for Full Website", () => {
    const result = calculateScopeEstimate("full_website", 0, []);
    expect(result.totalPrice).toBe(5000);
    expect(result.depositPrice).toBe(2500);
    expect(result.totalDays).toBe(18);
    expect(result.timelineWeeks).toBe("2.6");
  });

  it("adds optional features to total price and calculates 50% deposit", () => {
    const result = calculateScopeEstimate("full_website", 0, ["webgl_3d", "seo_copy"]);
    // 5000 + 1000 + 750 = 6750
    expect(result.totalPrice).toBe(6750);
    expect(result.depositPrice).toBe(3375);
    expect(result.totalDays).toBe(18 + 4 + 2); // 24 days
    expect(result.timelineWeeks).toBe("3.4");
  });

  it("handles extra pages and rush delivery timeframe reduction", () => {
    const result = calculateScopeEstimate("landing_page", 2, ["rush_delivery"]);
    // Base 2500 + (2 * 400 = 800) + 1500 = 4800
    expect(result.totalPrice).toBe(4800);
    // Base days 7 + 3 (pages) - 5 (rush) = 5 days
    expect(result.totalDays).toBe(5);
  });
});
