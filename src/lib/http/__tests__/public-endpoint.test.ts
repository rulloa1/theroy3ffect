import { describe, expect, it } from "vitest";
import { json, timingSafeEqual } from "@/lib/http/public-endpoint";

describe("timingSafeEqual", () => {
  it("accepts identical strings", () => {
    expect(timingSafeEqual("", "")).toBe(true);
    expect(timingSafeEqual("a", "a")).toBe(true);
    expect(timingSafeEqual("s3cr3t-token", "s3cr3t-token")).toBe(true);
    expect(timingSafeEqual("a".repeat(256), "a".repeat(256))).toBe(true);
  });

  it("rejects strings that differ at any position", () => {
    // First, middle, and last character — the loop must not short-circuit.
    expect(timingSafeEqual("Xbcdef", "abcdef")).toBe(false);
    expect(timingSafeEqual("abcXef", "abcdef")).toBe(false);
    expect(timingSafeEqual("abcdeX", "abcdef")).toBe(false);
  });

  it("rejects length mismatches, including prefixes of the secret", () => {
    expect(timingSafeEqual("", "secret")).toBe(false);
    expect(timingSafeEqual("secret", "")).toBe(false);
    expect(timingSafeEqual("secr", "secret")).toBe(false);
    expect(timingSafeEqual("secretsecret", "secret")).toBe(false);
  });

  it("is case- and whitespace-sensitive", () => {
    expect(timingSafeEqual("Secret", "secret")).toBe(false);
    expect(timingSafeEqual(" secret", "secret ")).toBe(false);
  });

  it("distinguishes characters that share their low byte", () => {
    // A XOR compare truncated to 8 bits would call these pairs equal.
    // U+0141 vs U+0041, and U+0161 vs U+0061.
    expect(timingSafeEqual(String.fromCharCode(0x141), "A")).toBe(false);
    expect(timingSafeEqual(String.fromCharCode(0x161), "a")).toBe(false);
  });
});

describe("json", () => {
  it("defaults to 200 with a JSON content type", async () => {
    const res = json({ ok: true });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it("uses the status it is given", async () => {
    const res = json({ error: "Unauthorized" }, 401);
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });
});
