import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { rpc: (name: string) => rpc(name) },
}));

const { json, requireAutomationToken, timingSafeEqual } =
  await import("@/lib/http/public-endpoint");

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

describe("requireAutomationToken", () => {
  const TOKEN = "a".repeat(64);
  const request = (token?: string) =>
    new Request("https://example.test/api/public/automation/followups", {
      method: "POST",
      ...(token === undefined ? {} : { headers: { "x-automation-token": token } }),
    });

  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({ data: TOKEN });
  });

  it("authorizes a caller presenting the configured token", async () => {
    await expect(requireAutomationToken(request(TOKEN))).resolves.toBeNull();
    expect(rpc).toHaveBeenCalledWith("automation_cron_token");
  });

  it("rejects a wrong token with a JSON 401", async () => {
    const denied = await requireAutomationToken(request("b".repeat(64)));
    expect(denied?.status).toBe(401);
    expect(denied?.headers.get("Content-Type")).toBe("application/json");
    await expect(denied?.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("rejects a caller that sends no token header", async () => {
    expect((await requireAutomationToken(request()))?.status).toBe(401);
  });

  it("rejects a token that is merely a prefix of the real one", async () => {
    expect((await requireAutomationToken(request(TOKEN.slice(0, 32))))?.status).toBe(401);
  });

  it("fails closed when the token is not configured", async () => {
    // No row, or an empty token, must never authorize an empty header.
    for (const data of [null, undefined, ""]) {
      rpc.mockResolvedValue({ data });
      expect((await requireAutomationToken(request()))?.status, String(data)).toBe(401);
      expect((await requireAutomationToken(request(TOKEN)))?.status, String(data)).toBe(401);
    }
  });
});
