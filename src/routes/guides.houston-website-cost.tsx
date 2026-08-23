import { createFileRoute } from "@tanstack/react-router";
import { GuideArticle, GuideParagraph, GuideSection } from "@/components/GuideArticle";

const TITLE = "Houston Website Cost in 2026: Real Prices | The Roy Effect";
const DESCRIPTION =
  "What a website actually costs in Houston in 2026 — DIY builders, freelancers and custom studios compared, with real published prices from a working Houston designer.";
const URL = "https://www.theroyeffect.com/guides/houston-website-cost";
const PUBLISHED = "2026-08-23";

export const Route = createFileRoute("/guides/houston-website-cost")({
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
          headline: "How much does a website cost in Houston in 2026?",
          description: DESCRIPTION,
          url: URL,
          datePublished: PUBLISHED,
          dateModified: PUBLISHED,
          author: { "@id": "https://www.theroyeffect.com/#person" },
          publisher: { "@id": "https://www.theroyeffect.com/#service" },
          isAccessibleForFree: true,
        }),
      },
    ],
  }),
  component: HoustonWebsiteCostGuide,
});

const APPROACHES = [
  {
    approach: "DIY builder (Squarespace, Wix)",
    typical: "$20–$50 / month",
    youGet: "Templates, hosting and a drag-and-drop editor. You supply the time, the copy and the design judgement.",
    bestFor: "Pre-revenue ideas and simple brochure sites.",
  },
  {
    approach: "Template freelancer",
    typical: "$1,000–$3,000 one-time",
    youGet: "An off-the-shelf theme with your logo and colours dropped in. Quality varies enormously at this price.",
    bestFor: "Businesses that need something passable, fast.",
  },
  {
    approach: "Custom design + build",
    typical: "$5,000–$15,000+ one-time",
    youGet: "Strategy, custom design, copy shaped around your customers, and a build tuned for speed and search.",
    bestFor: "Businesses where the website is a primary source of leads.",
  },
];

const DRIVERS = [
  {
    name: "Page count and structure",
    body: "A five-page brochure site and a thirty-page service site with location pages are different projects. Every distinct template adds design and build time.",
  },
  {
    name: "Who writes the words",
    body: "Copy is the single biggest quality lever on a small-business site. If the quote assumes you'll 'provide content', price in the hours that actually takes you — or pay for it to be written properly.",
  },
  {
    name: "Custom design vs a themed template",
    body: "A template with your colours is cheap because thousands of sites share its layout. Custom design costs more because it's built around your message, your customers and your conversion path.",
  },
  {
    name: "Integrations",
    body: "Booking systems, payment collection, CRMs, quote calculators and member areas all add build and testing time. List every tool your site must talk to before asking for quotes.",
  },
  {
    name: "Ongoing care",
    body: "Websites need updates, backups and small improvements. Budget either a monthly retainer or your own time — a site nobody maintains drifts out of date within a year.",
  },
];

const MY_PRICES = [
  { name: "Brand Sprint", price: "from $2,500", note: "Logo system, palette, type and brand guidelines for early-stage teams." },
  { name: "Website / UI-UX design", price: "from $5,000", note: "Full visual design: wireframes, high-fidelity screens, clickable prototype." },
  { name: "Design + Build", price: "from $8,000", note: "Everything in design, plus the no-code build, CMS, and performance & SEO basics." },
  { name: "Retainer", price: "$3,000 / month", note: "Ongoing design capacity for teams shipping continuously." },
];

function HoustonWebsiteCostGuide() {
  return (
    <GuideArticle
      kicker="GUIDE — PRICING"
      title="How much does a website cost in Houston?"
      lede="A straight answer with real numbers — including mine. What Houston businesses actually pay in 2026 for each approach, what drives the price up or down, and how to read a quote before you sign one."
      dateLabel="AUG 23, 2026"
      readTime="7 MIN READ"
      cta={{
        kicker: "NO-OBLIGATION NUMBERS",
        heading: "See my exact pricing",
        body: "Every tier I offer is published with deposits, add-ons and what's included — the same numbers quoted in this article. If it fits, you can start with a 50% deposit today.",
        primary: { label: "SEE PRICING", to: "/pricing" },
        secondary: { label: "GET A FREE AUDIT FIRST", to: "/audit" },
      }}
      related={[
        {
          title: "The 15-point website audit checklist",
          blurb: "Score your current site in 30 minutes before you spend anything.",
          to: "/guides/website-audit-checklist",
        },
        {
          title: "Squarespace vs a custom website",
          blurb: "The honest three-year cost comparison nobody on either side gives you.",
          to: "/guides/squarespace-vs-custom-website",
        },
      ]}
    >
      <GuideSection title="The short answer">
        <GuideParagraph>
          In Houston in 2026, a small-business website lands in one of three bands: a DIY builder
          subscription that costs little money but a lot of your time, a template-based freelancer
          build in the low four figures, or a custom design and build from the mid four figures
          upward. The right band depends on one question: is your website decoration, or is it
          supposed to bring in business?
        </GuideParagraph>
      </GuideSection>

      <GuideSection title="What each approach costs">
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-3 pr-4 font-mono text-[11px] tracking-widest text-white/40">APPROACH</th>
                <th className="py-3 pr-4 font-mono text-[11px] tracking-widest text-white/40">TYPICAL COST</th>
                <th className="py-3 pr-4 font-mono text-[11px] tracking-widest text-white/40">WHAT YOU GET</th>
                <th className="py-3 font-mono text-[11px] tracking-widest text-white/40">BEST FOR</th>
              </tr>
            </thead>
            <tbody>
              {APPROACHES.map((row) => (
                <tr key={row.approach} className="border-b border-white/5 align-top">
                  <td className="py-4 pr-4 font-display text-sm uppercase text-white">{row.approach}</td>
                  <td className="py-4 pr-4 font-mono text-xs text-[#FF3333]">{row.typical}</td>
                  <td className="py-4 pr-4 font-mono text-xs leading-relaxed text-white/60">{row.youGet}</td>
                  <td className="py-4 font-mono text-xs leading-relaxed text-white/60">{row.bestFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GuideSection>

      <GuideSection title="What actually drives the price">
        <div className="mt-4 space-y-4">
          {DRIVERS.map((d) => (
            <article key={d.name} className="border border-white/10 bg-white/[0.02] p-6">
              <h3 className="font-display text-lg uppercase text-white">{d.name}</h3>
              <p className="mt-2 font-mono text-xs leading-relaxed text-white/60 md:text-sm">
                {d.body}
              </p>
            </article>
          ))}
        </div>
      </GuideSection>

      <GuideSection title="What I charge, in the open">
        <GuideParagraph>
          Most designers hide pricing until a sales call. I'd rather you self-qualify, so here are
          my real numbers — the same ones on my pricing page, with 50% deposits to start:
        </GuideParagraph>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {MY_PRICES.map((p) => (
            <div key={p.name} className="border border-white/10 bg-white/[0.02] p-6">
              <h3 className="font-display text-lg uppercase text-white">{p.name}</h3>
              <p className="mt-1 font-mono text-sm text-[#FF3333]">{p.price}</p>
              <p className="mt-2 font-mono text-xs leading-relaxed text-white/50">{p.note}</p>
            </div>
          ))}
        </div>
        <GuideParagraph>
          <span className="mt-6 block">
            Add-ons are published too: extra revision round $350, rush delivery $750, extra landing
            page $900. If a quote you're comparing against doesn't itemise like this, ask why.
          </span>
        </GuideParagraph>
      </GuideSection>

      <GuideSection title="How to read a quote">
        <GuideParagraph>
          Three questions cut through most proposals. First: what exactly ships — page count,
          templates, and who writes the copy? Second: what happens after launch — is any support
          window included? Third: what do I own — domain, content, design files, and the ability to
          leave without penalty? A confident designer answers all three in writing. If you're
          weighing a builder subscription against custom work, read my{" "}
          <a
            href="/guides/squarespace-vs-custom-website"
            className="text-[#FF3333] underline underline-offset-4"
          >
            Squarespace vs custom cost breakdown
          </a>{" "}
          next.
        </GuideParagraph>
      </GuideSection>
    </GuideArticle>
  );
}
