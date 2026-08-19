import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/hooks/useAuth";
import { SiteFooter } from "@/components/SiteFooter";
import { VoiceConcierge } from "@/components/VoiceConcierge";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://www.theroyeffect.com/#person",
      name: "Rory Ulloa",
      url: "https://www.theroyeffect.com",
      jobTitle: "Creative Director & UI/UX Designer",
      email: "rory@theroyeffect.com",
      telephone: "281-323-0450",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Houston",
        addressRegion: "TX",
        addressCountry: "US",
      },
      knowsAbout: [
        "User Interface Design",
        "User Experience Design",
        "Brand Identity Systems",
        "Design Systems",
        "No-Code Development",
      ],
    },
    {
      "@type": "ProfessionalService",
      "@id": "https://www.theroyeffect.com/#service",
      name: "The Roy Effect",
      slogan: "Design With Purpose",
      url: "https://www.theroyeffect.com",
      telephone: "281-323-0450",
      founder: { "@id": "https://www.theroyeffect.com/#person" },
      priceRange: "$$$$",
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Design & Build Services",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Brand Sprint",
              description: "Brand strategy, logo system, and visual guidelines.",
            },
            price: "2500",
            priceCurrency: "USD",
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Website / UI-UX",
              description: "Full visual design and clickable prototype for digital products.",
            },
            price: "5000",
            priceCurrency: "USD",
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Design + Build",
              description: "End-to-end design paired with a production no-code build.",
            },
            price: "8000",
            priceCurrency: "USD",
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Design Retainer",
              description: "Ongoing monthly creative direction and UI/UX partnership.",
            },
            price: "3000",
            priceCurrency: "USD",
          },
        ],
      },
    },
  ],
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Rory Ulloa — Creative Director & UI/UX Designer" },
      {
        name: "description",
        content:
          "Portfolio & studio of Rory Ulloa, an independent Creative Director and UI/UX designer crafting bold brand systems, high-contrast digital experiences and no-code builds.",
      },
      { name: "author", content: "Rory Ulloa" },
      { property: "og:title", content: "Rory Ulloa — Creative Director & UI/UX Designer" },
      {
        property: "og:description",
        content:
          "Bold brand systems, high-contrast digital experiences and production-ready builds by Rory Ulloa.",
      },
      { property: "og:site_name", content: "theroyeffect.com" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "google-site-verification", content: "77GixI64Yh4THH1-qNE6EXBc87IRpeA76Jo1KHyaTCA" },
      { name: "google-site-verification", content: "abyZ_limkEmpSFo8qAaXN9SRvACJ8wTWriZNi-XPtAI" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@300..700&family=IBM+Plex+Mono:wght@300;400;500&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },

    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(STRUCTURED_DATA),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <SiteFooter />
        <VoiceConcierge />

      </AuthProvider>
    </QueryClientProvider>
  );
}

