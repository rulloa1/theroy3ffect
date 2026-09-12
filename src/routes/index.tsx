import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { CinematicHomepage } from "@/components/CinematicHomepage";
import ogImageAsset from "@/assets/og-preview.jpg.asset.json";

const HERO_IMAGE_ABSOLUTE = `https://theroyeffect.com${ogImageAsset.url}`;
const TITLE = "Houston Web Design — Rory Ulloa | The Roy Effect";
const DESCRIPTION = "Houston web design, UI/UX, brand systems and no-code builds by independent creative director Rory Ulloa. Free personalised video website audit.";

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
  return (
    <>
      <CinematicHomepage />
      <Toaster />
    </>
  );
}