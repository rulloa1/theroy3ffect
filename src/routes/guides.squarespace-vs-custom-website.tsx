import { createFileRoute } from "@tanstack/react-router";
import { GuideArticle, GuideParagraph, GuideSection } from "@/components/GuideArticle";

const TITLE = "Squarespace vs Custom Website: True Cost | The Roy Effect";
const DESCRIPTION =
  "Squarespace plans run about $19–$99/month in 2026 — but subscription fees are the smallest part of the real cost. An honest 3-year comparison for Houston small businesses.";
const URL = "https://www.theroyeffect.com/guides/squarespace-vs-custom-website";
const PUBLISHED = "2026-08-23";

export const Route = createFileRoute("/guides/squarespace-vs-custom-website")({
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
          headline: "Squarespace vs a custom website: what you actually pay over three years",
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
  component: SquarespaceVsCustomGuide,
});

const BUILDER_WINS = [
  "You're pre-revenue or validating an idea — speed and low cash cost matter more than conversion polish.",
  "You enjoy tinkering and can genuinely commit 20–40 hours to learning the editor, structuring pages and writing copy.",
  "The site is a digital business card: a few pages, a phone number, and nobody is choosing between you and a competitor online.",
];

const CUSTOM_WINS = [
  "Your website is a primary lead source and a competitor's site is one browser tab away from yours.",
  "You rely on local search — custom structure, page speed and per-service pages are the levers that move local rankings.",
  "Your time is billable. Forty hours of DIY at your hourly rate often exceeds the deposit on a custom build.",
  "You need the site to do things: take deposits, book calls, qualify leads — not just display pages.",
];

function SquarespaceVsCustomGuide() {
  return (
    <GuideArticle
      kicker="GUIDE — HONEST COMPARISON"
      title="Squarespace vs a custom website"
      lede="I build custom sites for a living, so you'd expect me to trash website builders. I won't. Here's the real three-year math, where builders genuinely win, and the point at which custom pays for itself."
      dateLabel="AUG 23, 2026"
      readTime="7 MIN READ"
      cta={{
        kicker: "READY FOR CUSTOM?",
        heading: "See what a build includes",
        body: "My services page lays out exactly what a custom engagement covers — strategy, design, build, and the conversion details a template can't give you.",
        primary: { label: "SEE SERVICES", to: "/services" },
        secondary: { label: "CHECK PRICING", to: "/pricing" },
      }}
      related={[
        {
          title: "How much does a website cost in Houston?",
          blurb: "Real 2026 prices — including mine — and what actually drives the number.",
          to: "/guides/houston-website-cost",
        },
        {
          title: "The 15-point website audit checklist",
          blurb: "Score your current site in 30 minutes before you spend anything.",
          to: "/guides/website-audit-checklist",
        },
      ]}
    >
      <GuideSection title="The sticker price is the small number">
        <GuideParagraph>
          As of 2026, Squarespace's plans run from about $19/month (Basic) to $99/month (Advanced)
          on annual billing — roughly $230 to $1,190 a year. You can check current tiers on{" "}
          <a
            href="https://www.squarespace.com/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FF3333] underline underline-offset-4"
          >
            their pricing page
          </a>
          . Over three years that's about $684 to $3,564 in subscription fees. Lower tiers also
          take a cut of your sales in transaction fees, and features most businesses eventually
          want — pop-ups, commerce integrations, lower card rates — sit behind the pricier plans.
        </GuideParagraph>
        <GuideParagraph>
          <span className="mt-4 block">
            Compare that with a custom design and build: my own published rate is from $8,000
            one-time, with hosting and tooling typically under $50/month after that. On cash alone,
            the builder is cheaper. Which is exactly why the subscription number is the wrong
            comparison — the real cost of a DIY site is measured in your hours and in the
            customers who bounced.
          </span>
        </GuideParagraph>
      </GuideSection>

      <GuideSection title="The cost nobody itemises: your time">
        <GuideParagraph>
          A realistic DIY build for someone who hasn't done it before: 20 to 40 hours learning the
          editor, fighting layouts, writing copy, sourcing images and setting up forms and domain
          records. Value your time at whatever you charge clients — for most owner-run businesses
          in Houston, those hours alone rival a custom deposit. And the output is still a template
          thousands of other sites share.
        </GuideParagraph>
      </GuideSection>

      <GuideSection title="Where builders genuinely win">
        <ul className="mt-6 space-y-4">
          {BUILDER_WINS.map((item) => (
            <li
              key={item}
              className="border-l-2 border-[#FF3333]/60 bg-white/[0.02] py-4 pl-5 pr-4 font-mono text-xs leading-relaxed text-white/70 md:text-sm"
            >
              {item}
            </li>
          ))}
        </ul>
        <GuideParagraph>
          <span className="mt-6 block">
            If that's you, use a builder with my blessing — and run your result through my{" "}
            <a
              href="/guides/website-audit-checklist"
              className="text-[#FF3333] underline underline-offset-4"
            >
              15-point audit checklist
            </a>{" "}
            so the common DIY mistakes don't quietly follow you to launch.
          </span>
        </GuideParagraph>
      </GuideSection>

      <GuideSection title="Where custom pays for itself">
        <ul className="mt-6 space-y-4">
          {CUSTOM_WINS.map((item) => (
            <li
              key={item}
              className="border-l-2 border-[#FF3333]/60 bg-white/[0.02] py-4 pl-5 pr-4 font-mono text-xs leading-relaxed text-white/70 md:text-sm"
            >
              {item}
            </li>
          ))}
        </ul>
        <GuideParagraph>
          <span className="mt-6 block">
            The crossover point is simpler than people expect: if one new customer covers your
            margin on a custom build, the site only has to win you one job the template would have
            lost. For most service businesses in Houston, that's one decent contract — not a
            hundred.
          </span>
        </GuideParagraph>
      </GuideSection>

      <GuideSection title="The honest verdict">
        <GuideParagraph>
          Builders are the right tool until the website becomes a salesperson. When it does, the
          question stops being "what does a website cost?" and becomes "what does an underperforming
          one cost me every month?" If you're at that point, the next step isn't a quote — it's a{" "}
          <a href="/audit" className="text-[#FF3333] underline underline-offset-4">
            free 5-minute audit
          </a>{" "}
          of whatever you have now, so any rebuild starts from evidence instead of taste.
        </GuideParagraph>
      </GuideSection>
    </GuideArticle>
  );
}
