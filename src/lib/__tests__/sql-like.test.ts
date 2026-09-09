import { describe, expect, it } from "vitest";
import { escapeLikePattern } from "@/lib/sql-like";

describe("escapeLikePattern", () => {
  it("leaves an ordinary email untouched", () => {
    expect(escapeLikePattern("rory@theroyeffect.com")).toBe("rory@theroyeffect.com");
  });

  it("escapes the single-character wildcard so a legal underscore stays literal", () => {
    // Unescaped, `r_ry@…` matches `rory@…` — one account reading another's rows.
    expect(escapeLikePattern("r_ry@theroyeffect.com")).toBe("r\\_ry@theroyeffect.com");
  });

  it("escapes the multi-character wildcard", () => {
    expect(escapeLikePattern("%@%.%")).toBe("\\%@\\%.\\%");
  });

  it("escapes the escape character itself", () => {
    expect(escapeLikePattern("a\\b@c.com")).toBe("a\\\\b@c.com");
  });
});
