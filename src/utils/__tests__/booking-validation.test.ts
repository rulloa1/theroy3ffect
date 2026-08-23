import { describe, expect, it } from "vitest";
import { bookingSlotSchema, formatSlot, SLOT_HOURS_UTC, SLOT_MINUTES } from "@/utils/booking.server";

const futureSlot = () => new Date(Date.now() + 48 * 3600_000).toISOString();

describe("bookingSlotSchema", () => {
  it("accepts a complete booking request", () => {
    const parsed = bookingSlotSchema.parse({
      full_name: "Jane Doe",
      email: "jane@company.com",
      phone: "(281) 555-1234",
      slot_start: futureSlot(),
      time_zone: "America/Chicago",
      notes: "Want to talk about a redesign.",
    });
    expect(parsed.full_name).toBe("Jane Doe");
    expect(parsed.time_zone).toBe("America/Chicago");
  });

  it("defaults the time zone when omitted", () => {
    const parsed = bookingSlotSchema.parse({
      full_name: "Jane Doe",
      email: "jane@company.com",
      slot_start: futureSlot(),
    });
    expect(parsed.time_zone).toBe("America/Chicago");
  });

  it("rejects missing name, bad email, and empty slot", () => {
    expect(() =>
      bookingSlotSchema.parse({ full_name: "", email: "jane@company.com", slot_start: futureSlot() }),
    ).toThrow();
    expect(() =>
      bookingSlotSchema.parse({ full_name: "Jane", email: "not-an-email", slot_start: futureSlot() }),
    ).toThrow();
    expect(() =>
      bookingSlotSchema.parse({ full_name: "Jane", email: "jane@company.com", slot_start: "" }),
    ).toThrow();
  });

  it("rejects over-long fields that could bloat the database", () => {
    expect(() =>
      bookingSlotSchema.parse({
        full_name: "x".repeat(121),
        email: "jane@company.com",
        slot_start: futureSlot(),
      }),
    ).toThrow();
    expect(() =>
      bookingSlotSchema.parse({
        full_name: "Jane",
        email: "jane@company.com",
        slot_start: futureSlot(),
        notes: "x".repeat(2001),
      }),
    ).toThrow();
  });
});

describe("slot configuration", () => {
  it("offers 15-minute slots at the expected UTC hours", () => {
    expect(SLOT_MINUTES).toBe(15);
    expect(SLOT_HOURS_UTC).toEqual([15, 18, 20]);
  });

  it("formats slots in Central time for confirmation emails", () => {
    // 2026-08-25 15:00 UTC = 10:00 AM Central (CDT).
    const spoken = formatSlot(new Date(Date.UTC(2026, 7, 25, 15, 0, 0)));
    expect(spoken).toContain("10:00");
    expect(spoken).toContain("August 25");
  });
});
