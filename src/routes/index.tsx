import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ParticleBackground } from "@/components/ParticleBackground";
import { SiteHeader, type NavTarget } from "@/components/SiteHeader";
import { HeroContent } from "@/components/HeroContent";
import { FooterMarquee } from "@/components/FooterMarquee";
import { InfoDrawer } from "@/components/InfoDrawer";

const HERO_IMAGE =
  "https://strvid.nyc3.cdn.digitaloceanspaces.com/motionsite/hero_main_1.png.png";

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
      { property: "og:image", content: HERO_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: HERO_IMAGE },
    ],
    links: [{ rel: "canonical", href: "https://www.theroyeffect.com/" }],
  }),
  component: Home,
});

function Home() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSection, setDrawerSection] = useState<Exclude<NavTarget, "MENU"> | null>(null);

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#030014]">
      <ParticleBackground />

      <SiteHeader
        onNavigate={(target) => {
          setDrawerSection(target === "MENU" ? null : target);
          setDrawerOpen(true);
        }}
      />

      <HeroContent />

      <img
        src={HERO_IMAGE}
        alt="Rory Ulloa"
        loading="eager"
        className="pointer-events-auto absolute bottom-0 left-1/2 z-10 h-[85%] -translate-x-1/2 object-contain object-bottom grayscale contrast-125 brightness-95 drop-shadow-[0_25px_50px_rgba(0,0,0,0.5)] transition-transform duration-700 ease-out hover:scale-[1.04] md:h-[100%] lg:h-[110%]"
      />

      <FooterMarquee />

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
