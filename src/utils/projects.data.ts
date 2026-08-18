export interface PortfolioProject {
  id: string;
  title: string;
  tagline: string;
  description: string;
  url: string;
  category: "Brand Identity" | "UI/UX" | "No-Code";
  metric?: string | null;
  tags: string[];
  sort_order?: number;
  is_published?: boolean;
}

export const DEFAULT_SHOWCASE_PROJECTS: PortfolioProject[] = [
  {
    id: "default-zest-depot",
    title: "Zest Depot",
    tagline: "Retail brand system & commerce build",
    description:
      "A modern, high-energy storefront and brand system built for a fast-moving retail concept. Focus on high conversion, clear typography, and bold visual identity.",
    url: "https://zest-depot-dev.lovable.app",
    category: "Brand Identity",
    metric: "40% faster checkout",
    tags: ["UI/UX", "Brand Identity", "No-Code Build"],
    sort_order: 1,
    is_published: true,
  },
  {
    id: "default-hyperspace",
    title: "HyperSpace AI",
    tagline: "SaaS interface & design system",
    description:
      "End-to-end dark-mode interface design and comprehensive component library for an agentic AI data analytics platform with interactive canvas nodes.",
    url: "https://theroyeffect.com",
    category: "UI/UX",
    metric: "120+ design tokens",
    tags: ["UI/UX", "Design Systems", "SaaS Interface"],
    sort_order: 2,
    is_published: true,
  },
  {
    id: "default-kinetix",
    title: "Kinetix Studio",
    tagline: "Interactive 3D agency portfolio",
    description:
      "WebGL-powered experience with dynamic particle physics and kinetic typography, designed and shipped for an independent creative production studio.",
    url: "https://theroyeffect.com",
    category: "No-Code",
    metric: "Sub-1s interactive load",
    tags: ["WebGL / 3D", "Interactive", "No-Code Build"],
    sort_order: 3,
    is_published: true,
  },
  {
    id: "default-aether",
    title: "Aether Protocol",
    tagline: "Fintech terminal & identity system",
    description:
      "High-density trading interface and minimalist identity system built for speed, typographic precision, and frictionless cross-chain liquidity management.",
    url: "https://theroyeffect.com",
    category: "UI/UX",
    metric: "Institutional-grade UX",
    tags: ["Fintech", "UI/UX", "Design + Build"],
    sort_order: 4,
    is_published: true,
  },
];

export function mapShowcaseRow(p: Record<string, unknown>): PortfolioProject {
  return {
    id: String(p["id"]),
    title: String(p["title"]),
    tagline: String(p["tagline"]),
    description: String(p["description"]),
    url: String(p["url"]),
    category: p["category"] as "Brand Identity" | "UI/UX" | "No-Code",
    metric: typeof p["metric"] === "string" ? p["metric"] : null,
    tags: Array.isArray(p["tags"]) ? (p["tags"] as string[]) : [],
    sort_order: typeof p["sort_order"] === "number" ? p["sort_order"] : 0,
    is_published: typeof p["is_published"] === "boolean" ? p["is_published"] : true,
  };
}
