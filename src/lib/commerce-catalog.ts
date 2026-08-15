// Client-safe catalog of everything for sale. Price IDs match the payment
// provider's lookup keys.

export interface PurchaseOption {
  priceId: string;
  label: string;
  amountLabel: string;
  recurring?: boolean;
}

export interface CatalogTier {
  name: string;
  price: string;
  note: string;
  description: string;
  features: string[];
  cta: string;
  featured?: boolean;
  deposit: PurchaseOption;
  full: PurchaseOption;
}

export const PRICING_TIERS: CatalogTier[] = [
  {
    name: "BRAND SPRINT",
    price: "$2,500",
    note: "from",
    description:
      "A focused brand identity package for early-stage teams and personal brands.",
    features: [
      "Brand strategy workshop",
      "Logo system + variations",
      "Color palette & typography",
      "Basic brand guidelines",
      "2 revision rounds",
    ],
    cta: "START A BRAND SPRINT",
    deposit: {
      priceId: "deposit_brand_sprint_onetime",
      label: "50% deposit",
      amountLabel: "$1,250",
    },
    full: {
      priceId: "brand_sprint_full_onetime",
      label: "Pay in full",
      amountLabel: "$2,500",
    },
  },
  {
    name: "WEBSITE / UI-UX",
    price: "$5,000",
    note: "from",
    description:
      "Full visual design and prototype for websites, apps, or digital products.",
    features: [
      "UX audit & wireframes",
      "High-fidelity UI designs",
      "Responsive screens",
      "Clickable prototype",
      "3 revision rounds",
    ],
    cta: "DESIGN MY PRODUCT",
    featured: true,
    deposit: {
      priceId: "deposit_website_uiux_onetime",
      label: "50% deposit",
      amountLabel: "$2,500",
    },
    full: {
      priceId: "website_uiux_full_onetime",
      label: "Pay in full",
      amountLabel: "$5,000",
    },
  },
  {
    name: "DESIGN + BUILD",
    price: "$8,000",
    note: "from",
    description:
      "End-to-end design paired with a no-code build on Webflow, Framer, or TanStack.",
    features: [
      "Everything in Website/UI-UX",
      "No-code development",
      "CMS & dynamic content setup",
      "Performance & SEO basics",
      "Post-launch support (14 days)",
    ],
    cta: "BUILD THE FULL THING",
    deposit: {
      priceId: "deposit_design_build_onetime",
      label: "50% deposit",
      amountLabel: "$4,000",
    },
    full: {
      priceId: "design_build_full_onetime",
      label: "Pay in full",
      amountLabel: "$8,000",
    },
  },
  {
    name: "RETAINER",
    price: "$3,000",
    note: "/mo",
    description:
      "Ongoing design partnership for teams that need consistent creative output.",
    features: [
      "Monthly design capacity",
      "Priority turnaround",
      "Brand stewardship",
      "Weekly async sync",
      "Pause or cancel anytime",
    ],
    cta: "SET UP A RETAINER",
    deposit: {
      priceId: "deposit_retainer_onetime",
      label: "First month only",
      amountLabel: "$3,000",
    },
    full: {
      priceId: "retainer_monthly",
      label: "Subscribe monthly",
      amountLabel: "$3,000/mo",
      recurring: true,
    },
  },
];

export interface CatalogAddOn {
  name: string;
  priceId: string;
  amountLabel: string;
  description: string;
}

export const ADD_ONS: CatalogAddOn[] = [
  {
    name: "EXTRA REVISION ROUND",
    priceId: "addon_revision_round_onetime",
    amountLabel: "$350",
    description: "One additional round of revisions on an active project.",
  },
  {
    name: "RUSH DELIVERY",
    priceId: "addon_rush_delivery_onetime",
    amountLabel: "$750",
    description: "Priority scheduling and a compressed timeline.",
  },
  {
    name: "EXTRA LANDING PAGE",
    priceId: "addon_extra_page_onetime",
    amountLabel: "$900",
    description: "One additional designed (and optionally built) page.",
  },
];
