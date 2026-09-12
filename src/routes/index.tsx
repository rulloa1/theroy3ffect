import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ParticleBackground } from "@/components/ParticleBackground";
import { SiteHeader, type NavTarget } from "@/components/SiteHeader";
import { HeroContent } from "@/components/HeroContent";
import { InfoDrawer } from "@/components/InfoDrawer";
import { Pricing } from "@/components/Pricing";
import { WorkGrid } from "@/components/WorkGrid";
import { ArrowUpRight, Check, SearchCheck, Zap, Smartphone, Timer } from "lucide-react";
import portraitAsset from "@/assets/rory-portrait-clean.png.asset.json";
import ogImageAsset from "@/assets/og-preview.jpg.asset.json";

const HERO_IMAGE = portraitAsset.url;
const HERO_IMAGE_ABSOLUTE = `https://theroyeffect.com${ogImageAsset.url}`;
const TITLE = "Houston Web Design — Rory Ulloa | The Roy Effect";
const DESCRIPTION = "Houston web design, UI/UX, brand systems and no-code builds by independent creative director Rory Ulloa. Free 5-minute website audit.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://theroyeffect.com/" },
      { property: "og:image", content: HERO_IMAGE_ABSOLUTE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: HERO_IMAGE_ABSOLUTE },
    ],
    links: [{ rel: "canonical", href: "https://theroyeffect.com/" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "@id": "https://theroyeffect.com/#business",
        name: "The Roy Effect",
        url: "https://theroyeffect.com",
        email: "rory@theroyeffect.com",
        telephone: "+1-281-323-0450",
        founder: { "@type": "Person", name: "Rory Ulloa" },
        address: { "@type": "PostalAddress", addressLocality: "Houston", addressRegion: "TX", addressCountry: "US" },
        areaServed: { "@type": "City", name: "Houston" },
      }),
    }],
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

  return (
    <main className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#030014]">
      <ParticleBackground />
      <SiteHeader onNavigate={openDrawer} />

      <section className="relative min-h-[42rem] overflow-hidden md:min-h-screen">
        <HeroContent />
        <img src={HERO_IMAGE} alt="Rory Ulloa — Creative Director, UI/UX Designer and no-code developer" loading="eager" decoding="async" fetchPriority="high" width={1200} height={1600} className="pointer-events-none absolute bottom-0 right-[-18%] z-10 h-[38%] w-auto max-w-none object-contain object-bottom opacity-40 grayscale contrast-125 sm:right-0 sm:h-[55%] sm:opacity-55 md:h-[84%] md:opacity-70 lg:right-[2%]" />
      </section>

      <section id="work" className="relative z-20 bg-[#030014] px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-7xl"><span className="font-mono text-xs tracking-widest text-[#FF3333]">SELECTED WORK</span><h2 className="mt-3 font-display text-4xl uppercase text-white md:text-6xl">Recent work</h2><div className="mt-10"><WorkGrid compact /></div><p className="mt-5 font-mono text-[11px] text-white/40">Named results and numbers go up with client permission.</p></div>
      </section>

      <section className="relative z-20 border-y border-white/10 bg-[#0a0620] px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-7xl"><span className="font-mono text-xs tracking-widest text-[#DFBA73]">FIT</span><h2 className="mt-3 font-display text-4xl uppercase text-white md:text-6xl">Who it&apos;s for</h2><div className="mt-10 grid gap-8 md:grid-cols-2">
          <div className="border-l-2 border-[#FF3333] pl-6"><h3 className="font-display text-2xl uppercase text-white">I take</h3><p className="mt-3 max-w-lg font-mono text-sm leading-relaxed text-white/60">Houston and remote founders, personal brands, and service businesses that already have demand and a weak site.</p></div>
          <div className="border-l border-white/20 pl-6"><h3 className="font-display text-2xl uppercase text-white">I pass</h3><p className="mt-3 max-w-lg font-mono text-sm leading-relaxed text-white/60">Logo-only jobs with no strategy, 40-page brochure rebuilds on a $1,500 budget, and “make it pop” with no offer.</p></div>
        </div></div>
      </section>

      <Pricing />

      <section className="relative z-20 w-full bg-[#030014] px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-7xl"><div className="grid gap-10 border border-[#FF3333]/30 bg-[#FF3333]/5 p-8 md:grid-cols-2 md:items-center md:p-12 lg:p-16"><div><span className="font-mono text-xs tracking-widest text-[#FF3333]">FREE 5-MINUTE AUDIT</span><h2 className="mt-3 font-display text-4xl uppercase leading-[0.9] text-white md:text-6xl">Is your website costing you clients?</h2><p className="mt-4 max-w-md font-mono text-sm leading-relaxed text-white/60">I&apos;ll send a complimentary video teardown of your homepage, mobile UX and conversion flow, with three quick wins you can apply this week.</p><Link to="/audit" className="mt-8 inline-flex items-center gap-2 bg-[#FF3333] px-6 py-4 font-mono text-xs font-bold tracking-widest text-black hover:bg-[#FF5555]">CLAIM YOUR FREE AUDIT <ArrowUpRight className="size-4" /></Link></div>
          <div className="grid gap-4 sm:grid-cols-2">{[[SearchCheck,"Conversion audit","Find the leaks in your funnel and fix your messaging."],[Smartphone,"Mobile UX review","See where friction kills enquiries on phones."],[Zap,"Quick wins","Actionable fixes you can implement this week."],[Timer,"5 minutes","Just your URL. No call, no pitch, no spam."]].map(([Icon,title,copy]) => { const AuditIcon = Icon as typeof SearchCheck; return <div key={String(title)} className="border border-white/10 bg-white/[0.02] p-5"><AuditIcon className="mb-3 size-5 text-[#FF3333]"/><h3 className="font-display text-lg uppercase text-white">{String(title)}</h3><p className="mt-1 font-mono text-xs leading-relaxed text-white/50">{String(copy)}</p></div>})}</div></div></div>
      </section>

      <section className="relative z-20 w-full bg-[#030014] px-5 py-20 md:px-10 md:py-28"><div className="mx-auto max-w-7xl"><div className="grid gap-10 border border-white/10 bg-white/[0.02] p-8 md:grid-cols-2 md:items-center md:p-12 lg:p-16"><div><span className="font-mono text-xs tracking-widest text-[#FF3333]">15-MINUTE DISCOVERY CALL</span><h2 className="mt-3 font-display text-4xl uppercase leading-[0.9] text-white md:text-6xl">Book a call</h2><p className="mt-4 max-w-md font-mono text-sm leading-relaxed text-white/60">Bring the goal, timeline, and budget. I&apos;ll leave you with a clear written recommendation.</p><Link to="/book" className="mt-8 inline-flex items-center gap-2 bg-[#FF3333] px-6 py-4 font-mono text-xs font-bold tracking-widest text-black hover:bg-[#FF5555]">BOOK A DISCOVERY CALL <ArrowUpRight className="size-4" /></Link></div><ul className="space-y-4 border border-white/10 bg-[#030014] p-6 font-mono text-sm text-white/70 md:p-8">{["15 minutes, no pitch","Scope, timeline, budget","Leave with a written recommendation"].map((item)=><li key={item} className="flex items-start gap-3"><Check className="mt-0.5 size-4 shrink-0 text-[#FF3333]"/><span>{item}</span></li>)}</ul></div></div></section>

      <section className="relative z-20 border-t border-white/10 bg-[#0a0620] px-5 py-16 md:px-10 md:py-20"><div className="mx-auto max-w-7xl"><h2 className="font-display text-3xl uppercase text-white md:text-5xl">Web design in Houston</h2><p className="mt-4 max-w-3xl font-mono text-sm leading-relaxed text-white/60">I&apos;m based near Houston and work remotely with founders and service businesses. Most projects start with the free audit; starting investment is $2,500 for brand, $5,000 for UI/UX, and $8,000 for design + build.</p><div className="mt-5 flex flex-wrap gap-5"><Link to="/guides/houston-website-cost" className="font-mono text-xs text-[#DFBA73] hover:text-white">HOUSTON WEBSITE COST →</Link><Link to="/guides/squarespace-vs-custom-website" className="font-mono text-xs text-[#DFBA73] hover:text-white">SQUARESPACE VS CUSTOM →</Link></div></div></section>

      <InfoDrawer open={drawerOpen} section={drawerSection} onClose={() => { setDrawerOpen(false); setDrawerSection(null); }} />
      <Toaster />
    </main>
  );
}