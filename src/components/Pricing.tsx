import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles, Lock } from "lucide-react";
import { DepositCheckoutModal } from "@/components/DepositCheckoutModal";

export const PRICING_TIERS = [
  {
    name: "BRAND SPRINT",
    price: "$2,500",
    note: "from",
    description: "A focused brand identity package for early-stage teams and personal brands.",
    features: [
      "Brand strategy workshop",
      "Logo system + variations",
      "Color palette & typography",
      "Basic brand guidelines",
      "2 revision rounds",
    ],
    cta: "START A BRAND SPRINT",
    depositPriceId: "deposit_brand_sprint_onetime",
    depositLabel: "$1,250 deposit (50%)",
  },
  {
    name: "WEBSITE / UI-UX",
    price: "$5,000",
    note: "from",
    description: "Full visual design and prototype for websites, apps, or digital products.",
    features: [
      "UX audit & wireframes",
      "High-fidelity UI designs",
      "Responsive screens",
      "Clickable prototype",
      "3 revision rounds",
    ],
    cta: "DESIGN MY PRODUCT",
    depositPriceId: "deposit_website_uiux_onetime",
    depositLabel: "$2,500 deposit (50%)",
    featured: true,
  },
  {
    name: "DESIGN + BUILD",
    price: "$8,000",
    note: "from",
    description: "End-to-end design paired with a no-code build on Webflow, Framer, or TanStack.",
    features: [
      "Everything in Website/UI-UX",
      "No-code development",
      "CMS & dynamic content setup",
      "Performance & SEO basics",
      "Post-launch support (14 days)",
    ],
    cta: "BUILD THE FULL THING",
    depositPriceId: "deposit_design_build_onetime",
    depositLabel: "$4,000 deposit (50%)",
  },
  {
    name: "RETAINER",
    price: "$3,000",
    note: "/mo",
    description: "Ongoing design partnership for teams that need consistent creative output.",
    features: [
      "Monthly design capacity",
      "Priority turnaround",
      "Brand stewardship",
      "Weekly async sync",
      "Pause or cancel anytime",
    ],
    cta: "SET UP A RETAINER",
    depositPriceId: "deposit_retainer_onetime",
    depositLabel: "$3,000 first month",
  },
];

export function Pricing({ onCommission }: { onCommission?: () => void }) {
  return (
    <section id="pricing" className="relative z-20 w-full bg-[#030014] px-5 py-20 md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-4 md:mb-20 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="font-mono text-xs tracking-widest text-[#FF3333]">PRICING</span>
            <h2 className="mt-3 font-display text-4xl uppercase leading-[0.9] text-white md:text-6xl lg:text-7xl">
              INVESTMENT
            </h2>
          </div>
          <p className="max-w-md font-mono text-xs leading-relaxed text-white/50">
            Transparent starting points. Every project gets a custom scope and quote before any
            work begins.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRICING_TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`group relative flex flex-col justify-between border p-5 transition-colors hover:border-[#FF3333]/50 md:p-6 ${
                tier.featured
                  ? "border-[#FF3333] bg-[#FF3333]/5"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              {tier.featured && (
                <div className="absolute -top-3 left-5 flex items-center gap-1 bg-[#FF3333] px-2 py-1 font-mono text-[10px] font-bold tracking-widest text-black">
                  <Sparkles className="size-3" />
                  POPULAR
                </div>
              )}

              <div>
                <h3 className="font-display text-xl uppercase tracking-wide text-white md:text-2xl">
                  {tier.name}
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-mono text-xs text-white/40">{tier.note}</span>
                  <span className="font-display text-4xl text-[#FF3333] md:text-5xl">
                    {tier.price}
                  </span>
                </div>
                <p className="mt-3 font-mono text-xs leading-relaxed text-white/50">
                  {tier.description}
                </p>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 font-mono text-xs text-white/70">
                      <Check className="mt-0.5 size-3 shrink-0 text-[#FF3333]" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={onCommission}
                className={`mt-8 flex w-full items-center justify-center gap-2 px-4 py-3 font-mono text-xs tracking-widest transition-all ${
                  tier.featured
                    ? "bg-[#FF3333] text-black hover:bg-[#FF3333]/90"
                    : "border border-white/20 text-white hover:border-[#FF3333] hover:bg-[#FF3333] hover:text-black"
                }`}
              >
                {tier.cta}
                <ArrowRight className="size-3" />
              </button>
            </motion.div>
          ))}
        </div>

        <p className="mt-10 max-w-2xl font-mono text-[11px] leading-relaxed text-white/40">
          All projects begin with a free 15-minute discovery call. Not sure which tier fits? Pick a
          starting point and I’ll tailor the scope to your budget and timeline.
        </p>
      </div>
    </section>
  );
}
