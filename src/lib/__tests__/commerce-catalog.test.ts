import { describe, expect, it } from "vitest";
import {
  ADD_ON_CENTS,
  ADD_ONS,
  DEPOSIT_BALANCE_CENTS,
  PRICING_TIERS,
  getAddOnByPriceId,
} from "@/lib/commerce-catalog";
import { PRICE_ID_PATTERN } from "@/lib/checkout-validation";

/**
 * Revenue-path integrity: if the catalog drifts from the payment provider's
 * lookup keys or the deposit/balance math breaks, checkout and invoicing
 * silently charge the wrong amounts. These tests fail loudly instead.
 */
describe("commerce catalog integrity", () => {
  it("uses validator-safe lookup keys for every sellable item", () => {
    const ids = [
      ...PRICING_TIERS.flatMap((t) => [t.deposit.priceId, t.full.priceId]),
      ...ADD_ONS.map((a) => a.priceId),
    ];
    for (const id of ids) expect(id).toMatch(PRICE_ID_PATTERN);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("deposit balances only exist for real deposit prices", () => {
    const depositIds = new Set(PRICING_TIERS.map((t) => t.deposit.priceId));
    for (const key of Object.keys(DEPOSIT_BALANCE_CENTS)) {
      expect(depositIds.has(key)).toBe(true);
    }
  });

  it("deposit + balance equals the full price for one-time tiers", () => {
    const parse = (label: string) => Number(label.replace(/[^0-9]/g, "")) * 100;
    for (const tier of PRICING_TIERS.filter((t) => !t.full.recurring)) {
      const balance = DEPOSIT_BALANCE_CENTS[tier.deposit.priceId];
      expect(balance, `${tier.name} should carry a remaining balance`).toBeDefined();
      expect(parse(tier.deposit.amountLabel) + balance!).toBe(parse(tier.full.amountLabel));
    }
  });

  it("recurring retainer carries no deposit balance", () => {
    const retainer = PRICING_TIERS.find((t) => t.full.recurring);
    expect(retainer).toBeDefined();
    expect(DEPOSIT_BALANCE_CENTS[retainer!.deposit.priceId]).toBeUndefined();
  });

  it("add-on cents table matches the add-on catalog exactly", () => {
    expect(Object.keys(ADD_ON_CENTS).sort()).toEqual(ADD_ONS.map((a) => a.priceId).sort());
    for (const addOn of ADD_ONS) {
      expect(getAddOnByPriceId(addOn.priceId)?.name).toBe(addOn.name);
    }
  });
});
