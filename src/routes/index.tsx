import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ParticleBackground } from "@/components/ParticleBackground";
import { SiteHeader, type NavTarget } from "@/components/SiteHeader";
import { HeroContent } from "@/components/HeroContent";
import { FooterMarquee } from "@/components/FooterMarquee";
import { InfoDrawer } from "@/components/InfoDrawer";
import { Pricing } from "@/components/Pricing";
import { ArrowUpRight, Check, SearchCheck, Zap, Smartphone, Timer } from "lucide-react";

import portraitAsset from "@/assets/rory-portrait-clean.png.asset.json";
import ogImageAsset from "@/assets/og-preview.jpg.asset.json";

const HERO_IMAGE = portraitAsset.url;
// Social crawlers flatten transparency onto white, so share previews use an
// opaque JPEG composited on the site's deep-space background.
const HERO_IMAGE_ABSOLUTE = `https://www.theroyeffect.com${ogImageAsset.url}`;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Houston Web Design — Creative Director & UI/UX Designer" },
      {
        name: "description",
        content:
          "Rory Ulloa is a Houston, Texas creative director and UI/UX designer offering web design, brand systems and no-code builds for bold businesses.",
      },
      { property: "og:title", content: "Houston Web Design — Rory Ulloa, Creative Director & UI/UX Designer" },
      {
        property: "og:description",
        content:
          "Houston web design, UI/UX design, brand systems and no-code builds by creative director Rory Ulloa.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: HERO_IMAGE_ABSOLUTE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: HERO_IMAGE_ABSOLUTE },
    ],
    links: [{ rel: "canonical", href: "https://www.theroyeffect.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": "https://www.theroyeffect.com/#website",
          url: "https://www.theroyeffect.com",
          name: "The Roy Effect",
          publisher: { "@id": "https://www.theroyeffect.com/#service" },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": "https://www.theroyeffect.com/#home",
          url: "https://www.theroyeffect.com/",
          name: "Houston Web Design — Creative Director & UI/UX Designer",
          isPartOf: { "@id": "https://www.theroyeffect.com/#website" },
          about: { "@id": "https://www.theroyeffect.com/#service" },
        }),
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSection, setDrawerSection] = useState<Exclude<NavTarget, "MENU"> | null>(null);

  const openDrawer = (target: NavTarget) => {
    setDrawerSection(target === "MENU" ? null : target);
    setDrawerOpen(true);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#contact") {
      openDrawer("LET'S WORK");
    }
  }, []);

  return (
    <main className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#030014]">
      <ParticleBackground />

      <SiteHeader onNavigate={openDrawer} />

      <div className="relative flex min-h-screen shrink-0 flex-col overflow-hidden">
        <HeroContent />

        <img
          src={HERO_IMAGE}
          alt="Rory Ulloa — Creative Director & UI/UX Designer"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          width={1200}
          height={1600}
          className="pointer-events-auto absolute left-1/2 bottom-0 z-10 h-[62vh] w-auto max-w-none -translate-x-1/2 object-contain object-bottom grayscale contrast-125 brightness-95 drop-shadow-[0_25px_50px_rgba(0,0,0,0.5)] transition-transform duration-700 ease-out hover:scale-[1.03] sm:h-[78vh] md:bottom-auto md:top-[24vh] md:h-[120vh] md:object-top"
        />

        <FooterMarquee />
      </div>

      <Pricing onCommission={() => openDrawer("LET'S WORK")} />

      <section
        id="audit"
        className="relative z-20 w-full bg-[#030014] px-5 py-20 md:px-10 md:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 border border-[#FF3333]/30 bg-[#FF3333]/5 p-8 md:grid-cols-2 md:items-center md:p-12 lg:p-16">
            <div>
              <span className="font-mono text-xs tracking-widest text-[#FF3333]">
                FREE 5-MINUTE AUDIT
              </span>
              <h2 className="mt-3 font-display text-4xl uppercase leading-[0.9] text-white md:text-5xl lg:text-6xl">
                Is your website costing you clients?
              </h2>
              <p className="mt-4 max-w-md font-mono text-sm leading-relaxed text-white/60">
                Get a complimentary video teardown of your homepage, mobile UX and conversion
                flow. I'll send you three quick wins you can apply this week.
              </p>
              <Link
                to="/audit"
                className="mt-8 inline-flex items-center gap-2 bg-[#FF3333] px-6 py-4 font-mono text-xs font-bold tracking-widest text-black transition-all hover:bg-[#FF5555]"
              >
                CLAIM YOUR FREE AUDIT
                <ArrowUpRight className="size-4" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-white/10 bg-white/[0.02] p-5">
                <SearchCheck className="mb-3 size-5 text-[#FF3333]" />
                <h3 className="font-display text-lg uppercase text-white">Conversion audit</h3>
                <p className="mt-1 font-mono text-xs leading-relaxed text-white/50">
                  Find the leaks in your funnel and fix your messaging.
                </p>
              </div>
              <div className="border border-white/10 bg-white/[0.02] p-5">
                <Smartphone className="mb-3 size-5 text-[#FF3333]" />
                <h3 className="font-display text-lg uppercase text-white">Mobile UX review</h3>
                <p className="mt-1 font-mono text-xs leading-relaxed text-white/50">
                  See where friction kills enquiries on phones.
                </p>
              </div>
              <div className="border border-white/10 bg-white/[0.02] p-5">
                <Zap className="mb-3 size-5 text-[#FF3333]" />
                <h3 className="font-display text-lg uppercase text-white">Quick wins</h3>
                <p className="mt-1 font-mono text-xs leading-relaxed text-white/50">
                  Actionable fixes you can implement this week.
                </p>
              </div>
              <div className="border border-white/10 bg-white/[0.02] p-5">
                <Timer className="mb-3 size-5 text-[#FF3333]" />
                <h3 className="font-display text-lg uppercase text-white">5 minutes</h3>
                <p className="mt-1 font-mono text-xs leading-relaxed text-white/50">
                  Just your URL. No call, no pitch, no spam.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 w-full bg-[#030014] px-5 py-20 md:px-10 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 border border-white/10 bg-white/[0.02] p-8 md:grid-cols-2 md:items-center md:p-12 lg:p-16">
            <div>
              <span className="font-mono text-xs tracking-widest text-[#FF3333]">PREFER TO TALK?</span>
              <h2 className="mt-3 font-display text-4xl uppercase leading-[0.9] text-white md:text-5xl lg:text-6xl">
                Book a free 15-minute call
              </h2>
              <p className="mt-4 max-w-md font-mono text-sm leading-relaxed text-white/60">
                Not sure what you need yet? Grab a quick slot and we&apos;ll run through your goals,
                timeline, and budget.
              </p>
              <Link
                to="/book"
                className="mt-8 inline-flex items-center gap-2 bg-[#FF3333] px-6 py-4 font-mono text-xs font-bold tracking-widest text-black transition-all hover:bg-[#FF5555]"
              >
                BOOK A DISCOVERY CALL
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
            <div className="border border-white/10 bg-[#030014] p-6 md:p-8">
              <ul className="space-y-4 font-mono text-sm text-white/70">
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#FF3333]" />
                  <span>15 minutes, no pitch</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#FF3333]" />
                  <span>Scope, timeline, and budget clarity</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#FF3333]" />
                  <span>Leave with a written recommendation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <InfoDrawer
        open={drawerOpen}
        section={drawerSection}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerSection(null);
        }}
      />
      <Toaster />
    </main>
  );
}
