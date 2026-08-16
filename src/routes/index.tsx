import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ParticleBackground } from "@/components/ParticleBackground";
import { SiteHeader, type NavTarget } from "@/components/SiteHeader";
import { HeroContent } from "@/components/HeroContent";
import { FooterMarquee } from "@/components/FooterMarquee";
import { InfoDrawer } from "@/components/InfoDrawer";
import { Pricing } from "@/components/Pricing";

import portraitAsset from "@/assets/rory-portrait-clean.png.asset.json";
import ogImageAsset from "@/assets/og-preview.jpg.asset.json";

const HERO_IMAGE = portraitAsset.url;
// Social crawlers flatten transparency onto white, so share previews use an
// opaque JPEG composited on the site's deep-space background.
const HERO_IMAGE_ABSOLUTE = `https://www.theroyeffect.com${ogImageAsset.url}`;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rory Ulloa — Creative Director & UI/UX Designer" },
      {
        name: "description",
        content:
          "Rory Ulloa is a freelance creative director and UI/UX designer crafting bold, high-contrast digital experiences, brand systems and no-code builds.",
      },
      { property: "og:title", content: "Rory Ulloa — Creative Director & UI/UX Designer" },
      {
        property: "og:description",
        content:
          "Bold, high-contrast digital experiences: UI/UX design, brand systems and no-code builds by Rory Ulloa.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: HERO_IMAGE_ABSOLUTE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: HERO_IMAGE_ABSOLUTE },
    ],
    links: [{ rel: "canonical", href: "https://www.theroyeffect.com/" }],
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
          className="pointer-events-auto absolute left-1/2 top-[24vh] z-10 h-[120vh] w-auto max-w-none -translate-x-1/2 object-contain object-top grayscale contrast-125 brightness-95 drop-shadow-[0_25px_50px_rgba(0,0,0,0.5)] transition-transform duration-700 ease-out hover:scale-[1.03]"
        />

        <FooterMarquee />
      </div>

      <Pricing onCommission={() => openDrawer("LET'S WORK")} />

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
