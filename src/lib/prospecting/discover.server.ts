import { HOUSTON_BBOX, getIndustry } from "./industries";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

export interface DiscoveredBusiness {
  sourceRef: string;
  businessName: string;
  category: string | null;
  address: string | null;
  lat: number | null;
  lon: number | null;
  phone: string | null;
  website: string | null;
  email: string | null;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const clean = (value: string | undefined) => {
  const trimmed = (value ?? "").trim();
  return trimmed.length ? trimmed : null;
};

function normalizeWebsite(tags: Record<string, string>): string | null {
  const raw = clean(tags["website"]) ?? clean(tags["contact:website"]) ?? clean(tags["url"]);
  if (!raw) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  try {
    const url = new URL(withScheme);
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function buildAddress(tags: Record<string, string>): string | null {
  const parts = [
    [clean(tags["addr:housenumber"]), clean(tags["addr:street"])].filter(Boolean).join(" "),
    clean(tags["addr:city"]),
    clean(tags["addr:postcode"]),
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

/** Queries OpenStreetMap for Houston-area businesses in one industry. */
export async function discoverBusinesses(
  industryKey: string,
  limit = 60,
): Promise<DiscoveredBusiness[]> {
  const industry = getIndustry(industryKey);
  if (!industry) throw new Error(`Unknown industry: ${industryKey}`);

  const [south, west, north, east] = HOUSTON_BBOX;
  const bbox = `${south},${west},${north},${east}`;
  const clauses = industry.filters.map((f) => `nwr${f}(${bbox});`).join("\n  ");
  const query = `[out:json][timeout:60];\n(\n  ${clauses}\n);\nout center ${Math.min(limit * 4, 400)};`;

  let lastError: unknown = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ data: query }).toString(),
      });
      if (!response.ok) throw new Error(`Overpass ${response.status}`);
      const payload = (await response.json()) as { elements?: OverpassElement[] };
      const seen = new Set<string>();
      const results: DiscoveredBusiness[] = [];

      for (const element of payload.elements ?? []) {
        const tags = element.tags ?? {};
        const name = clean(tags["name"]);
        if (!name) continue;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        results.push({
          sourceRef: `${element.type}/${element.id}`,
          businessName: name,
          category: clean(tags["shop"]) ?? clean(tags["office"]) ?? clean(tags["craft"]) ?? clean(tags["healthcare"]) ?? clean(tags["amenity"]),
          address: buildAddress(tags),
          lat: element.lat ?? element.center?.lat ?? null,
          lon: element.lon ?? element.center?.lon ?? null,
          phone: clean(tags["phone"]) ?? clean(tags["contact:phone"]),
          website: normalizeWebsite(tags),
          email: clean(tags["email"]) ?? clean(tags["contact:email"]),
        });
        if (results.length >= limit) break;
      }
      return results;
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(
    `Could not reach the business directory: ${lastError instanceof Error ? lastError.message : "unknown error"}`,
  );
}
