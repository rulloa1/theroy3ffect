import { describe, it, expect } from "vitest";

const money = (cents: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(
    cents / 100,
  );

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

describe("Admin Utilities & Helpers", () => {
  it("formats cents into USD currency strings", () => {
    expect(money(500000)).toBe("$5,000.00");
    expect(money(250050)).toBe("$2,500.50");
    expect(money(0)).toBe("$0.00");
  });

  it("formats ISO timestamps into human readable dates", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate("2026-08-15T12:00:00Z")).toContain("2026");
  });
});
