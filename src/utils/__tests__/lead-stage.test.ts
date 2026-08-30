import { describe, expect, it } from "vitest";
import { resolveStage } from "@/utils/booking.server";

describe("resolveStage", () => {
  it("advances a lead forward along the ladder", () => {
    expect(resolveStage("new", "discovery_scheduled")).toBe("discovery_scheduled");
  });

  it("never pulls a lead backwards", () => {
    expect(resolveStage("discovery_scheduled", "new")).toBe("discovery_scheduled");
    expect(resolveStage("audit_in_progress", "new")).toBe("audit_in_progress");
  });

  it("always allows terminal / off-ladder stages", () => {
    expect(resolveStage("discovery_scheduled", "human_followup_required")).toBe(
      "human_followup_required",
    );
    expect(resolveStage("nurture", "new")).toBe("new");
  });

  it("leaves the stage untouched when no new stage is provided", () => {
    expect(resolveStage("new", undefined)).toBeUndefined();
  });
});
