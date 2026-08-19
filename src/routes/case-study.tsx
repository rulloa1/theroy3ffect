import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Compass, LayoutGrid, PenTool, Rocket, Smartphone } from "lucide-react";
import { Logo } from "@/components/Logo";

const TITLE = "Case Study — Redesigning a Houston Service Business Site | The Roy Effect";
const DESCRIPTION =
  "A walkthrough of how I take a Houston service business from a cluttered, hard-to-use website to a clear brand system and a fast, mobile-first site — problem, approach, design decisions and outcome.";
const URL = "https://www.theroyeffect.com/case-study";

export const Route = createFileRoute("/case-study")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Redesigning a Houston service business website: problem to result",
          description: DESCRIPTION,
          url: URL,
          author: { "@id": "https://www.theroyeffect.com/#person" },
          publisher: { "@id": "https://www.theroyeffect.com/#service" },
          isAccessibleForFree: true,
        }),
      },
    ],
  }),
  component: CaseStudyPage,
});

const PROBLEMS = [
  "Five different logo versions in circulation, none of them usable at small sizes.",
  "A homepage that opened with a company history instead of what the business actually does.",
  "Quote requests buried three clicks deep, behind a form nobody could complete on a phone.",
  "Service pages written for the owner, not for the person searching at 9pm with a problem.",
];

const STEPS = [
  {
    icon: Compass,
    title: "01 — Diagnose",
    body: "I started with the same 5-minute audit I offer free: walk the site as a first-time visitor on a phone, note every point of friction, and rank them by how much revenue they touch. Messaging and mobile quote flow came out on top; the logo was third.",
  },
  {
    icon: PenTool,
    title: "02 — Rebuild the brand basics",
    body: "One logo system with proper small-size and single-colour variants, a two-typeface pairing, and a tight colour set with real contrast rules. Enough of a system to stay consistent, not so much that nobody follows it.",
  },
  {
    icon: LayoutGrid,
    title: "03 — Rewrite before redesign",
    body: "The homepage now leads with what the business does, who it does it for and where. Each service page answers the question that brings people there, then makes the next step obvious. Layout was designed around that copy, not the other way round.",
  },
  {
    icon: Smartphone,
    title: "04 — Mobile-first build",
    body: "Designed at 360px first and scaled up. A short quote form above the fold, tap-to-call in the header, and no interstitial that hides the primary action on small screens.",
  },
  {
    icon: Rocket,
    title: "05 — Launch and hand over",
    body: "Shipped on a modern no-code / AI-assisted stack with forms, analytics and SEO basics wired up, plus a walkthrough so the owner can update copy without calling me.",
  },
];

const OUTCOMES = [
  {
    title: "One consistent brand",
    body: "Site, invoices, truck decals and social profiles finally use the same mark, type and colours.",
  },
  {
    title: "A quote request that works on a phone",
    body: "The primary action is visible on the first screen on mobile, and completing it takes seconds rather than a scroll hunt.",
  },
  {
    title: "Pages that answer a search",
    body: "Each service has its own page with its own title, description and clear intent — so it can be found and shared on its own.",
  },
  {
    title: "An owner who can maintain it",
    body: "Copy edits, new services and new photos no longer require a developer.",
  },
];

function CaseStudyPage() {
  return (
    <main className="min-h-screen bg-[#030014]">
      <div className="mx-auto max-w-4xl px-5 pt-16 md:px-10 md:pt-24">
        <Logo variant="compact" size="md" href="/" className="mb-10" />

        <span className="font-mono text-xs tracking-widest text-[#FF3333]">CASE STUDY</span>
        <h1 className="mt-3 font-display text-4xl uppercase leading-[0.9] text-white md:text-6xl">
          From a cluttered website to a brand people trust
        </h1>
        <p className="mt-5 max-w-2xl font-mono text-xs leading-relaxed text-white/60 md:text-sm">
          A representative walkthrough of how I work with a Houston service business — the problems
          I usually find, the order I fix them in, and what the business ends up with. Composite
          example built from the way these projects actually run; no client names, numbers or quotes
          are attached to it.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/audit"
            className="inline-flex items-center gap-2 bg-[#FF3333] px-6 py-4 font-mono text-xs font-bold tracking-widest text-black transition-all hover:bg-[#FF5555]"
          >
            GET THE SAME AUDIT, FREE
            <ArrowUpRight className="size-4" />
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 border border-white/20 px-6 py-4 font-mono text-xs tracking-widest text-white transition-colors hover:border-[#FF3333] hover:text-[#FF3333]"
          >
            SEE PRICING
          </Link>
        </div>
      </div>

      {/* Problem */}
      <section className="mx-auto mt-20 max-w-4xl px-5 md:mt-28 md:px-10">
        <h2 className="font-display text-3xl uppercase leading-[0.95] text-white md:text-4xl">
          The problem
        </h2>
        <p className="mt-4 max-w-2xl font-mono text-xs leading-relaxed text-white/60 md:text-sm">
          The business was busy but invisible online. Referrals kept it alive; the website actively
          worked against it. Four things showed up immediately:
        </p>
        <ul className="mt-8 space-y-4">
          {PROBLEMS.map((p) => (
            <li
              key={p}
              className="border-l-2 border-[#FF3333]/60 bg-white/[0.02] py-4 pl-5 pr-4 font-mono text-xs leading-relaxed text-white/70 md:text-sm"
            >
              {p}
            </li>
          ))}
        </ul>
      </section>

      {/* Approach */}
      <section className="mx-auto mt-20 max-w-4xl px-5 md:mt-28 md:px-10">
        <h2 className="font-display text-3xl uppercase leading-[0.95] text-white md:text-4xl">
          The approach
        </h2>
        <div className="mt-8 space-y-4">
          {STEPS.map(({ icon: Icon, title, body }) => (
            <article key={title} className="border border-white/10 bg-white/[0.02] p-6 md:p-8">
              <Icon className="mb-3 size-5 text-[#FF3333]" />
              <h3 className="font-display text-xl uppercase text-white">{title}</h3>
              <p className="mt-2 font-mono text-xs leading-relaxed text-white/60 md:text-sm">
                {body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Result */}
      <section className="mx-auto mt-20 max-w-4xl px-5 md:mt-28 md:px-10">
        <h2 className="font-display text-3xl uppercase leading-[0.95] text-white md:text-4xl">
          The result
        </h2>
        <p className="mt-4 max-w-2xl font-mono text-xs leading-relaxed text-white/60 md:text-sm">
          Described in what changed, not in invented statistics. Performance numbers belong to real
          named projects — when a client shares theirs, they'll appear here with their permission.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {OUTCOMES.map((o) => (
            <div key={o.title} className="border border-white/10 bg-white/[0.02] p-6">
              <h3 className="font-display text-lg uppercase text-white">{o.title}</h3>
              <p className="mt-2 font-mono text-xs leading-relaxed text-white/50">{o.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto mt-20 max-w-4xl px-5 pb-24 md:mt-28 md:px-10 md:pb-32">
        <div className="border border-[#FF3333]/30 bg-[#FF3333]/5 p-8 md:p-12">
          <span className="font-mono text-xs tracking-widest text-[#FF3333]">
            START THE SAME WAY
          </span>
          <h2 className="mt-3 font-display text-3xl uppercase leading-[0.9] text-white md:text-5xl">
            Every project starts with the audit
          </h2>
          <p className="mt-4 max-w-xl font-mono text-xs leading-relaxed text-white/60 md:text-sm">
            Send your URL and I'll record a free 5-minute teardown of your homepage, mobile UX and
            conversion flow — the exact first step described above. No call, no pitch.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/audit"
              className="inline-flex items-center gap-2 bg-[#FF3333] px-6 py-4 font-mono text-xs font-bold tracking-widest text-black transition-all hover:bg-[#FF5555]"
            >
              CLAIM YOUR FREE AUDIT
              <ArrowUpRight className="size-4" />
            </Link>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 border border-white/20 px-6 py-4 font-mono text-xs tracking-widest text-white transition-colors hover:border-[#FF3333] hover:text-[#FF3333]"
            >
              SEE SERVICES
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
