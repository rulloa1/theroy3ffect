import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ParticleBackground } from "@/components/ParticleBackground";
import { SiteHeader, type NavTarget } from "@/components/SiteHeader";
import { HeroContent } from "@/components/HeroContent";
import { FooterMarquee } from "@/components/FooterMarquee";
import { InfoDrawer } from "@/components/InfoDrawer";
import { Pricing } from "@/components/Pricing";

import portraitAsset from "@/assets/rory-portrait.png.asset.json";

const HERO_IMAGE = portraitAsset.url;
const HERO_IMAGE_ABSOLUTE = `https://www.theroyeffect.com${portraitAsset.url}`;

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

      <div className="relative min-h-screen shrink-0">
        <HeroContent />

        <img
          src={HERO_IMAGE}
          alt="Rory Ulloa"
          loading="eager"
          className="pointer-events-auto absolute bottom-0 left-1/2 z-10 h-[95%] -translate-x-1/2 object-contain object-bottom grayscale contrast-125 brightness-95 drop-shadow-[0_25px_50px_rgba(0,0,0,0.5)] transition-transform duration-700 ease-out hover:scale-[1.04] md:h-[100%] lg:h-[110%]"
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
