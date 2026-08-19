import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { Toaster } from "@/components/ui/sonner";
import { Pricing } from "@/components/Pricing";
import { PRICING_TIERS } from "@/lib/commerce-catalog";

const TITLE = "Pricing — Brand, Web Design & Retainer Rates | The Roy Effect";
const DESCRIPTION =
  "Transparent design pricing from Rory Ulloa: brand sprints from $2,500, web design and UI/UX from $5,000, full design + no-code builds from $8,000 and monthly retainers from $3,000. Pay a 50% deposit to start.";

const OFFER_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "OfferCatalog",
  name: "Design & build pricing",
  url: "https://www.theroyeffect.com/pricing",
  itemListElement: PRICING_TIERS.map((tier) => ({
    "@type": "Offer",
    priceCurrency: "USD",
    price: tier.price.replace(/[^0-9]/g, ""),
    url: "https://www.theroyeffect.com/pricing",
    itemOffered: {
      "@type": "Service",
      name: tier.name,
      description: tier.description,
      provider: { "@id": "https://www.theroyeffect.com/#service" },
    },
  })),
};

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.theroyeffect.com/pricing" }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(OFFER_SCHEMA) }],
  }),
  component: PricingPage,
});

function PricingPage() {
  const navigate = useNavigate();
  return (
    <main className="min-h-screen bg-[#030014]">
      <Toaster />
      <div className="mx-auto max-w-7xl px-5 pt-16 md:px-10 md:pt-24">
        <Logo variant="compact" size="md" href="/" className="mb-10" />
        <span className="font-mono text-xs tracking-widest text-[#FF3333]">PRICING</span>
        <h1 className="mt-3 font-display text-4xl uppercase leading-[0.9] text-white md:text-6xl">
          What it costs to work together
        </h1>
        <p className="mt-5 max-w-2xl font-mono text-xs leading-relaxed text-white/60 md:text-sm">
          Fixed starting points for brand, web design, full design-and-build and ongoing retainers.
          Every project is scoped and priced in writing before it starts — pay a 50% deposit to hold
          a slot, or use the scope calculator for a custom page count.
        </p>
        <div className="mt-6">
          <Link
            to="/services"
            className="font-mono text-xs tracking-widest text-[#DFBA73] underline underline-offset-4 hover:text-white"
          >
            SEE WHAT EACH SERVICE INCLUDES →
          </Link>
        </div>
      </div>
      <Pricing />
    </main>
  );
}
