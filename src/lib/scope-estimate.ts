/**
 * Scope estimator pricing.
 *
 * The math lives here, apart from the component, so the numbers a prospect sees
 * are the numbers under test — the old test file defined its own copy of this
 * function and asserted against that, which meant the shipped pricing path had
 * no coverage at all and drifted from both the test and the catalog.
 *
 * Base prices track `commerce-catalog.ts`: the estimator and the pricing grid
 * render on the same page, so a mismatch is visible to the client.
 */

export interface ScopeFeature {
  id: string;
  label: string;
  description: string;
  price: number;
  daysAdded: number;
}

export interface ProjectType {
  id: string;
  name: string;
  basePrice: number;
  baseDays: number;
  description: string;
  defaultPages: number;
  maxPages: number;
  isRetainer?: boolean;
}

/** Charged per page beyond a type's included count. */
export const EXTRA_PAGE_PRICE = 400;
/** Share of the total taken at kickoff. */
export const DEPOSIT_RATE = 0.5;
export const DEFAULT_PROJECT_TYPE_ID = "full_website";

export const PROJECT_TYPES: readonly ProjectType[] = [
  {
    id: "landing_page",
    name: "Conversion Landing Page",
    basePrice: 2500,
    baseDays: 7,
    description: "High-impact single page designed for maximum lead capture & sales.",
    defaultPages: 1,
    maxPages: 3,
  },
  {
    id: "brand_identity",
    name: "Brand Identity System",
    // Brand Sprint in the catalog.
    basePrice: 2500,
    baseDays: 5,
    description: "Comprehensive logo mark, typography guidelines, color palette & assets.",
    defaultPages: 0,
    maxPages: 0,
  },
  {
    id: "full_website",
    name: "Full Multi-Page Website",
    // Website / UI-UX in the catalog.
    basePrice: 5000,
    baseDays: 18,
    description: "Complete custom digital experience: marketing, services, case studies & CMS.",
    defaultPages: 5,
    maxPages: 15,
  },
  {
    id: "design_build",
    name: "Design + Build",
    // Design + Build in the catalog.
    basePrice: 8000,
    baseDays: 25,
    description: "Design through to a live, no-code build with everything wired up.",
    defaultPages: 5,
    maxPages: 15,
  },
  {
    id: "retainer",
    name: "Monthly Design Retainer",
    // Retainer in the catalog.
    basePrice: 3000,
    baseDays: 30,
    description: "Continuous UI/UX design & development queue with dedicated turnaround.",
    defaultPages: 0,
    maxPages: 0,
    isRetainer: true,
  },
];

export const OPTIONAL_FEATURES: readonly ScopeFeature[] = [
  {
    id: "webgl_3d",
    label: "3D / WebGL Shader Animations",
    description: "Custom interactive canvas, particle physics & kinetic micro-interactions",
    price: 1000,
    daysAdded: 4,
  },
  {
    id: "cms_system",
    label: "Dynamic CMS / Case Studies",
    description: "Self-serve content management for blog articles, work & client showcases",
    price: 750,
    daysAdded: 3,
  },
  {
    id: "stripe_commerce",
    label: "Stripe eCommerce & Checkouts",
    description: "Full cart, checkout sessions, customer portal & automatic receipt emails",
    price: 1000,
    daysAdded: 4,
  },
  {
    id: "brand_bundle",
    label: "Full Brand Visual Identity Suite",
    description: "Vector logo mark suite, custom fonts, favicon, and brand styleguide",
    price: 1500,
    daysAdded: 5,
  },
  {
    id: "seo_copy",
    label: "SEO Architecture & Copywriting",
    description: "High-converting sales copy, meta tags, schema markup & sitemap setup",
    price: 750,
    daysAdded: 2,
  },
  {
    id: "rush_delivery",
    // Named for what it does. "Save ~40% Timeline" was true of nothing: it is a
    // flat five days, which is 15% of a full website and 0% of what the old
    // week-rounded label displayed.
    label: "Priority Rush Kickoff (−5 Days)",
    description: "Dedicated priority build slot with expedited milestone reviews",
    price: 1500,
    daysAdded: -5,
  },
];

/** Shortest engagement quoted, in working days. */
export const MIN_DAYS = 5;

export function getProjectType(typeId: string): ProjectType {
  return (
    PROJECT_TYPES.find((t) => t.id === typeId) ??
    PROJECT_TYPES.find((t) => t.id === DEFAULT_PROJECT_TYPE_ID) ??
    PROJECT_TYPES[0]!
  );
}

export function getFeature(featureId: string): ScopeFeature | undefined {
  return OPTIONAL_FEATURES.find((f) => f.id === featureId);
}

export interface ScopeEstimate {
  totalPrice: number;
  depositPrice: number;
  /** Working days, rounded up and floored at MIN_DAYS. */
  days: number;
  /** Human range: days under a fortnight, weeks above. */
  timelineLabel: string;
}

export function calculateScopeEstimate(input: {
  typeId: string;
  pageCount: number;
  featureIds: readonly string[];
}): ScopeEstimate {
  const type = getProjectType(input.typeId);
  let price = type.basePrice;
  let days = type.baseDays;

  if (type.maxPages > 0 && input.pageCount > type.defaultPages) {
    const extraPages = Math.min(input.pageCount, type.maxPages) - type.defaultPages;
    price += extraPages * EXTRA_PAGE_PRICE;
    days += extraPages * 1.5;
  }

  // A retainer is a standing queue, so per-project add-ons don't apply.
  if (!type.isRetainer) {
    for (const featureId of input.featureIds) {
      const feature = getFeature(featureId);
      if (feature) {
        price += feature.price;
        days += feature.daysAdded;
      }
    }
  }

  const totalDays = Math.max(Math.ceil(days), MIN_DAYS);

  return {
    totalPrice: price,
    depositPrice: Math.round(price * DEPOSIT_RATE),
    days: totalDays,
    timelineLabel: timelineLabel(type, totalDays),
  };
}

/**
 * Quote short work in days. Rounding everything to weeks hid every change under
 * a fortnight — with the old label, paying $1,500 for the rush add-on on a
 * landing page moved "1–2 Weeks" to "1–2 Weeks".
 */
function timelineLabel(type: ProjectType, days: number): string {
  if (type.isRetainer) return "Monthly (Continuous)";
  if (days <= 10) return `${days}–${days + 2} Days`;
  const weeksMin = Math.max(1, Math.ceil(days / 7));
  return `${weeksMin}–${weeksMin + 1} Weeks`;
}
