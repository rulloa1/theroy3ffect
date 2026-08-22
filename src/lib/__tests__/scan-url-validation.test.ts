import { describe, expect, it } from "vitest";
import { assertPublicScanUrl, isBlockedIp } from "@/lib/prospecting/scan.server";

describe("isBlockedIp", () => {
  it("blocks loopback, private, link-local, and reserved IPv4 ranges", () => {
    for (const ip of [
      "127.0.0.1",
      "10.0.0.5",
      "10.255.255.255",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.1",
      "169.254.169.254", // cloud metadata endpoint
      "0.0.0.0",
      "100.64.0.1", // carrier-grade NAT
      "192.0.2.1", // TEST-NET-1
      "198.51.100.1", // TEST-NET-2
      "203.0.113.1", // TEST-NET-3
      "224.0.0.1", // multicast
      "255.255.255.255",
    ]) {
      expect(isBlockedIp(ip), ip).toBe(true);
    }
  });

  it("allows public IPv4 addresses", () => {
    for (const ip of ["8.8.8.8", "1.1.1.1", "172.15.0.1", "172.32.0.1", "104.21.5.19"]) {
      expect(isBlockedIp(ip), ip).toBe(false);
    }
  });

  it("blocks IPv6 loopback, link-local, unique-local, and IPv4-mapped forms", () => {
    expect(isBlockedIp("::1")).toBe(true);
    expect(isBlockedIp("::")).toBe(true);
    expect(isBlockedIp("fe80::1")).toBe(true);
    expect(isBlockedIp("fc00::1")).toBe(true);
    expect(isBlockedIp("fd12:3456::1")).toBe(true);
    expect(isBlockedIp("::ffff:127.0.0.1")).toBe(true);
    expect(isBlockedIp("::ffff:7f00:1")).toBe(true); // normalized mapped form
    expect(isBlockedIp("::ffff:169.254.169.254")).toBe(true);
  });

  it("allows public IPv6 addresses", () => {
    expect(isBlockedIp("2606:4700:4700::1111")).toBe(false);
    expect(isBlockedIp("::ffff:8.8.8.8")).toBe(false);
  });
});

describe("assertPublicScanUrl", () => {
  it("rejects non-http(s) schemes", async () => {
    await expect(assertPublicScanUrl("file:///etc/passwd")).rejects.toThrow();
    await expect(assertPublicScanUrl("ftp://example.com")).rejects.toThrow();
    await expect(assertPublicScanUrl("gopher://example.com")).rejects.toThrow();
  });

  it("rejects internal hostnames and literal private IPs without any DNS lookup", async () => {
    for (const url of [
      "http://localhost",
      "http://localhost:8080/admin",
      "http://127.0.0.1",
      "http://10.0.0.8/internal",
      "http://192.168.0.1",
      "http://169.254.169.254/latest/meta-data",
      "http://[::1]/",
      "http://[::ffff:127.0.0.1]/",
      "http://metadata.google.internal/",
      "http://printer.local/",
      "http://nas.internal/",
      // WHATWG URL normalizes decimal/hex IPv4 forms to dotted notation
      "http://2130706433/", // 127.0.0.1
      "http://0x7f000001/", // 127.0.0.1
    ]) {
      await expect(assertPublicScanUrl(url), url).rejects.toThrow();
    }
  });

  it("rejects URLs with embedded credentials", async () => {
    await expect(assertPublicScanUrl("http://user:pass@example.com")).rejects.toThrow();
  });

  it("rejects malformed URLs", async () => {
    await expect(assertPublicScanUrl("not a url")).rejects.toThrow();
  });

  it("allows literal public IP URLs without DNS", async () => {
    const url = await assertPublicScanUrl("http://8.8.8.8/");
    expect(url.hostname).toBe("8.8.8.8");
  });
});
