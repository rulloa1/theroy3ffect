import type { ProspectSignal } from "./industries";

export interface ScanResult {
  reachable: boolean;
  finalUrl: string | null;
  statusCode: number | null;
  loadMs: number | null;
  https: boolean;
  mobileFriendly: boolean;
  title: string | null;
  metaDescription: string | null;
  htmlBytes: number | null;
  hasPhoneLink: boolean;
  hasEmailLink: boolean;
  hasContactForm: boolean;
  hasBookingCta: boolean;
  copyrightYear: number | null;
  foundEmail: string | null;
  errorMessage: string | null;
}

const EMPTY: ScanResult = {
  reachable: false,
  finalUrl: null,
  statusCode: null,
  loadMs: null,
  https: false,
  mobileFriendly: false,
  title: null,
  metaDescription: null,
  htmlBytes: null,
  hasPhoneLink: false,
  hasEmailLink: false,
  hasContactForm: false,
  hasBookingCta: false,
  copyrightYear: null,
  foundEmail: null,
  errorMessage: null,
};

const BAD_EMAIL = /(example|sentry|wixpress|\.png|\.jpg|\.webp|\.gif|godaddy|domain)/i;

function extractEmail(html: string): string | null {
  const matches = html.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? [];
  for (const candidate of matches) {
    if (!BAD_EMAIL.test(candidate)) return candidate.toLowerCase();
  }
  return null;
}

// ---------------------------------------------------------------------------
// SSRF protection: prospect website URLs come from public OpenStreetMap data,
// which anyone can edit. Before fetching, every URL (and every redirect hop)
// is validated to point at a public http(s) address — never localhost,
// private/reserved IP ranges, or cloud metadata endpoints.
// ---------------------------------------------------------------------------

const MAX_REDIRECTS = 5;

const BLOCKED_HOSTNAME =
  /(^localhost$|\.localhost$|\.internal$|\.local$|\.lan$|\.home$|\.corp$|^metadata\.|^instance-data$)/i;

/** Returns true when an IPv4 address (dotted parts) is private, reserved, or non-routable. */
function isPrivateIpv4(parts: number[]): boolean {
  const [a, b, c] = parts;
  return (
    a === 0 || // 0.0.0.0/8 "this network"
    a === 10 || // 10.0.0.0/8 private
    a === 127 || // 127.0.0.0/8 loopback
    (a === 100 && b >= 64 && b <= 127) || // 100.64.0.0/10 carrier-grade NAT
    (a === 169 && b === 254) || // 169.254.0.0/16 link-local (cloud metadata: 169.254.169.254)
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12 private
    (a === 192 && b === 0) || // 192.0.0.0/24 + 192.0.2.0/24 (TEST-NET-1)
    (a === 192 && b === 168) || // 192.168.0.0/16 private
    (a === 198 && (b === 18 || b === 19)) || // 198.18.0.0/15 benchmarking
    (a === 198 && b === 51 && c === 100) || // TEST-NET-2
    (a === 203 && b === 0 && c === 113) || // TEST-NET-3
    a >= 224 // 224.0.0.0/4 multicast + 240.0.0.0/4 reserved
  );
}

function parseIpv4(ip: string): number[] | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return nums;
}

/** Returns true when an IPv4 or IPv6 address is loopback, private, link-local, or reserved. */
export function isBlockedIp(ip: string): boolean {
  const v4 = parseIpv4(ip);
  if (v4) return isPrivateIpv4(v4);

  const v6 = ip.toLowerCase();
  if (v6 === "::" || v6 === "::1") return true; // unspecified / loopback
  if (v6.startsWith("fe80:") || v6.startsWith("fe80::")) return true; // link-local
  if (/^[f][cd]/.test(v6)) return true; // fc00::/7 unique local
  // IPv4-mapped IPv6, e.g. ::ffff:127.0.0.1 or normalized ::ffff:7f00:1
  const mapped = v6.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped) {
    const embedded = parseIpv4(mapped[1]!);
    return embedded ? isPrivateIpv4(embedded) : true;
  }
  const mappedHex = v6.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mappedHex) {
    const hi = parseInt(mappedHex[1]!, 16);
    const lo = parseInt(mappedHex[2]!, 16);
    return isPrivateIpv4([hi >> 8, hi & 255, lo >> 8, lo & 255]);
  }
  return false;
}

/** Resolves a hostname via DNS-over-HTTPS and returns its A/AAAA records. */
async function resolveHostIps(hostname: string): Promise<string[] | null> {
  const ips: string[] = [];
  try {
    for (const type of ["A", "AAAA"] as const) {
      const res = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=${type}`,
        { headers: { accept: "application/dns-json" }, signal: AbortSignal.timeout(5_000) },
      );
      if (!res.ok) return null;
      const data = (await res.json()) as {
        Status: number;
        Answer?: { type: number; data: string }[];
      };
      if (data.Status === 3) continue; // NXDOMAIN for this record type
      if (data.Status !== 0) return null;
      const wanted = type === "A" ? 1 : 28;
      for (const answer of data.Answer ?? []) {
        if (answer.type === wanted) ips.push(answer.data);
      }
    }
  } catch {
    return null;
  }
  return ips;
}

/**
 * Validates that a URL is safe to fetch server-side: http(s) only, no embedded
 * credentials, no internal hostnames, and DNS resolves only to public IPs.
 * Throws with a client-safe message when the URL is not allowed.
 */
export async function assertPublicScanUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Website address is not a valid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https websites can be scanned");
  }
  if (url.username || url.password) {
    throw new Error("Website address must not contain credentials");
  }

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || BLOCKED_HOSTNAME.test(host)) {
    throw new Error("This website address is not allowed");
  }

  // Literal IP hosts skip DNS resolution and are checked directly.
  if (parseIpv4(host) || host.includes(":")) {
    if (isBlockedIp(host)) throw new Error("This website address is not allowed");
    return url;
  }

  const ips = await resolveHostIps(host);
  if (!ips || ips.length === 0) {
    throw new Error("Website address could not be resolved");
  }
  for (const ip of ips) {
    if (isBlockedIp(ip)) throw new Error("This website address is not allowed");
  }
  return url;
}

/** Fetches a prospect's homepage and records objective quality signals. */
export async function scanWebsite(rawUrl: string): Promise<ScanResult> {
  const started = Date.now();
  try {
    // Follow redirects manually so every hop is re-validated against the
    // public-address rules instead of blindly trusting the target server.
    let current = rawUrl;
    let response: Response | null = null;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      const url = await assertPublicScanUrl(current);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12_000);
      try {
        response = await fetch(url.toString(), {
          redirect: "manual",
          signal: controller.signal,
          headers: { "User-Agent": "TheRoyEffect-SiteCheck/1.0 (+https://www.theroyeffect.com)" },
        });
      } finally {
        clearTimeout(timer);
      }
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) break;
        current = new URL(location, url).toString();
        response = null;
        continue;
      }
      break;
    }
    if (!response) {
      return {
        ...EMPTY,
        loadMs: Date.now() - started,
        errorMessage: "Site redirected too many times",
      };
    }
    const loadMs = Date.now() - started;
    const html = (await response.text()).slice(0, 400_000);
    const lower = html.toLowerCase();
    const finalUrl = current;

    const yearMatch = html.match(/(?:©|&copy;|copyright)[^0-9]{0,20}(20\d{2})/i);

    return {
      reachable: response.ok,
      finalUrl,
      statusCode: response.status,
      loadMs,
      https: finalUrl.startsWith("https://"),
      mobileFriendly: /<meta[^>]+name=["']viewport["']/i.test(html),
      title: (html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)?.[1] ?? "").trim() || null,
      metaDescription:
        (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,300})["']/i)?.[1] ?? "").trim() ||
        null,
      htmlBytes: html.length,
      hasPhoneLink: lower.includes("tel:"),
      hasEmailLink: lower.includes("mailto:"),
      hasContactForm: lower.includes("<form") || lower.includes("typeform") || lower.includes("jotform"),
      hasBookingCta: /(book|schedule|appointment|free quote|get a quote|estimate)/i.test(html),
      copyrightYear: yearMatch?.[1] ? Number(yearMatch[1]) : null,
      foundEmail: extractEmail(html),
      errorMessage: response.ok ? null : `Site returned ${response.status}`,
    };
  } catch (error) {
    return {
      ...EMPTY,
      loadMs: Date.now() - started,
      errorMessage:
        error instanceof Error && error.name === "AbortError"
          ? "Site did not respond within 12 seconds"
          : error instanceof Error
            ? error.message
            : "Site could not be reached",
    };
  }
}

/** Turns a scan into weighted, human-readable problems. Higher score = more pain. */
export function scoreProspect(input: {
  hasWebsite: boolean;
  scan: ScanResult | null;
}): { score: number; signals: ProspectSignal[] } {
  const signals: ProspectSignal[] = [];
  const push = (s: ProspectSignal) => signals.push(s);

  if (!input.hasWebsite) {
    push({
      code: "no_website",
      label: "No website at all",
      detail: "We could not find any website listed for this business, so every search for them ends at a competitor.",
      weight: 50,
      severity: "critical",
    });
    return { score: 50, signals };
  }

  const scan = input.scan;
  if (!scan || !scan.reachable) {
    push({
      code: "site_down",
      label: "Website does not load",
      detail: scan?.errorMessage ?? "The site failed to respond when we checked it.",
      weight: 45,
      severity: "critical",
    });
    return { score: 45, signals };
  }

  if (!scan.https) {
    push({
      code: "no_https",
      label: "Not secure (no HTTPS)",
      detail: "Browsers show a 'Not secure' warning to every visitor, which kills trust instantly.",
      weight: 20,
      severity: "critical",
    });
  }
  if (!scan.mobileFriendly) {
    push({
      code: "not_mobile",
      label: "Not built for phones",
      detail: "The page has no mobile setup, so it renders zoomed-out on the phones most local customers use.",
      weight: 20,
      severity: "critical",
    });
  }
  if (scan.loadMs !== null && scan.loadMs > 3500) {
    push({
      code: "slow",
      label: `Slow to load (${(scan.loadMs / 1000).toFixed(1)}s)`,
      detail: "Most visitors leave after about three seconds of waiting.",
      weight: 14,
      severity: "warning",
    });
  }
  if (!scan.hasContactForm && !scan.hasEmailLink) {
    push({
      code: "no_contact_path",
      label: "No easy way to make contact",
      detail: "There is no contact form or email link on the homepage, so interested visitors have to work for it.",
      weight: 14,
      severity: "warning",
    });
  }
  if (!scan.hasPhoneLink) {
    push({
      code: "no_tap_to_call",
      label: "Phone number is not tap-to-call",
      detail: "On a phone, the number cannot be tapped to dial, which loses calls from people ready to book.",
      weight: 8,
      severity: "warning",
    });
  }
  if (!scan.hasBookingCta) {
    push({
      code: "no_cta",
      label: "No clear next step",
      detail: "Nothing on the homepage asks the visitor to book, call, or request a quote.",
      weight: 10,
      severity: "warning",
    });
  }
  if (!scan.title || scan.title.length < 12) {
    push({
      code: "weak_title",
      label: "Weak page title for Google",
      detail: "The title Google shows in search results is missing or too thin to rank for local searches.",
      weight: 10,
      severity: "warning",
    });
  }
  if (!scan.metaDescription) {
    push({
      code: "no_meta",
      label: "No search description",
      detail: "Google has no description to show under the listing, so it invents one from stray page text.",
      weight: 6,
      severity: "info",
    });
  }
  if (scan.copyrightYear !== null && scan.copyrightYear < new Date().getFullYear() - 2) {
    push({
      code: "stale",
      label: `Looks abandoned (footer says ${scan.copyrightYear})`,
      detail: "An old copyright year signals to visitors that the business may not be active.",
      weight: 8,
      severity: "warning",
    });
  }
  if (scan.htmlBytes !== null && scan.htmlBytes < 2500) {
    push({
      code: "thin",
      label: "Almost no content",
      detail: "The homepage is nearly empty, which gives Google nothing to rank and visitors nothing to trust.",
      weight: 12,
      severity: "warning",
    });
  }

  const score = Math.min(
    100,
    signals.reduce((sum, s) => sum + s.weight, 0),
  );
  return { score, signals };
}
