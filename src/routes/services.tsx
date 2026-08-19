import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Logo } from "@/components/Logo";
import { SERVICES, PROCESS_STEPS } from "@/lib/site-content";

const TITLE = "Design Services — Brand, UI/UX & No-Code Build | The Roy Effect";
const DESCRIPTION =
  "Freelance design services by Rory Ulloa: brand identity systems, web design and UI/UX, end-to-end no-code builds and monthly design retainers. Houston-based, working remotely across the US.";

const SERVICE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Design services",
  itemListElement: SERVICES.map((s, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Service",
      name: s.name,
      description: s.summary,
      serviceType: s.name,
      url: `https://www.theroyeffect.com/services#${s.slug}`,
      provider: { "@id": "https://www.theroyeffect.com/#service" },
      areaServed: { "@type": "Country", name: "United States" },
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: s.from.replace(/[^0-9]/g, ""),
        url: "https://www.theroyeffect.com/pricing",
      },
    },
  })),
};

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.theroyeffect.com/services" }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(SERVICE_SCHEMA) }],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <main className="min-h-screen bg-[#030014] px-5 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-5xl">
        <Logo variant="compact" size="md" href="/" className="mb-10" />

        <span className="font-mono text-xs tracking-widest text-[#FF3333]">SERVICES</span>
        <h1 className="mt-3 font-display text-4xl uppercase leading-[0.9] text-white md:text-6xl">
          Design &amp; build services
        </h1>
        <p className="mt-5 max-w-2xl font-mono text-xs leading-relaxed text-white/60 md:text-sm">
          I&apos;m Rory Ulloa — a freelance UI/UX designer and no-code developer based near Houston,
          Texas, working remotely with founders and small teams across the US. My work sits between
          brand and build: identity systems, high-contrast interface design, and shipped,
          production-ready websites. The thing you approve is the thing that goes live.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {SERVICES.map((s) => (
            <article
              key={s.slug}
              id={s.slug}
              className="border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-[#FF3333]/50"
            >
              <h2 className="font-display text-2xl uppercase tracking-wide text-white">{s.name}</h2>
              <p className="mt-2 font-mono text-[11px] tracking-widest text-[#DFBA73]">
                FROM {s.from}
              </p>
              <p className="mt-3 font-mono text-xs leading-relaxed text-white/60">{s.summary}</p>
              <ul className="mt-5 space-y-2">
                {s.deliverables.map((d) => (
                  <li key={d} className="flex items-start gap-2 font-mono text-xs text-white/70">
                    <Check className="mt-0.5 size-3 shrink-0 text-[#FF3333]" />
                    {d}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <section className="mt-20">
          <h2 className="font-display text-3xl uppercase leading-none text-white md:text-4xl">
            How I work
          </h2>
          <ol className="mt-8 space-y-6">
            {PROCESS_STEPS.map((item) => (
              <li key={item.step} className="border-l border-white/10 pl-4">
                <span className="font-mono text-[10px] tracking-widest text-[#FF3333]">
                  {item.step}
                </span>
                <h3 className="font-display text-xl uppercase tracking-wide text-white">
                  {item.title}
                </h3>
                <p className="mt-1 max-w-2xl font-mono text-xs leading-relaxed text-white/50">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-16 flex flex-wrap gap-3">
          <Link
            to="/pricing"
            className="inline-flex items-center bg-[#FF3333] px-5 py-3 font-mono text-xs tracking-widest text-black transition-opacity hover:opacity-90"
          >
            SEE PRICING
          </Link>
          <Link
            to="/brief"
            className="inline-flex items-center border border-white/20 px-5 py-3 font-mono text-xs tracking-widest text-white transition-colors hover:border-[#FF3333]"
          >
            START A BRIEF
          </Link>
        </div>
      </div>
    </main>
  );
}
