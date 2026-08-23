import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { GuideArticle, GuideParagraph, GuideSection } from "@/components/GuideArticle";

const TITLE = "Website Audit Checklist (2026): 15 Checks | The Roy Effect";
const DESCRIPTION =
  "A 15-point website audit checklist covering messaging, mobile speed, conversion paths, SEO basics and trust signals — the same checks I run on Houston small-business sites before any redesign.";
const URL = "https://www.theroyeffect.com/guides/website-audit-checklist";
const PUBLISHED = "2026-08-23";

export const Route = createFileRoute("/guides/website-audit-checklist")({
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
          headline: "The 15-point website audit checklist for small businesses",
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
  component: WebsiteAuditChecklistGuide,
});

const GROUPS: { title: string; intro: string; checks: { name: string; how: string }[] }[] = [
  {
    title: "01 — First impression & messaging",
    intro:
      "Most visitors decide whether to stay in seconds. These three checks tell you whether your site passes that first judgement.",
    checks: [
      {
        name: "The 5-second test",
        how: "Show your homepage to someone who has never seen it for five seconds. They should be able to say what you do, who it's for, and what to do next. If they can't, your hero section is failing.",
      },
      {
        name: "Headline is about the customer",
        how: "Read your main headline. If it leads with your company name, your history, or a slogan, rewrite it around the outcome the visitor wants.",
      },
      {
        name: "One primary action per page",
        how: "Count the buttons above the fold. If two or more compete (call us / learn more / watch video / subscribe), pick one winner and demote the rest.",
      },
    ],
  },
  {
    title: "02 — Mobile & speed",
    intro:
      "For most local service businesses, the majority of traffic is on a phone. Audit on a real phone, not a resized browser window.",
    checks: [
      {
        name: "The thumb test",
        how: "Open your site on a phone and try to reach your main call-to-action one-handed. If the primary button needs two hands or a zoom, it fails.",
      },
      {
        name: "Load time on cellular",
        how: "Test on a 4G connection, not office wifi. If the main content takes more than about three seconds to appear, oversized images and heavy scripts are usually the cause.",
      },
      {
        name: "Tap targets & text size",
        how: "Phone numbers should be tap-to-call. Buttons should be at least finger-sized. Body text should be readable without pinching to zoom.",
      },
    ],
  },
  {
    title: "03 — Conversion path",
    intro:
      "A good-looking site that makes contacting you hard is a brochure, not a salesperson. Walk the path a ready-to-buy visitor takes.",
    checks: [
      {
        name: "Contact option above the fold",
        how: "On both phone and desktop, a way to contact you should be visible without scrolling. Every extra scroll costs you enquiries.",
      },
      {
        name: "Form friction",
        how: "Count your form fields. Every field beyond about five measurably cuts completions. Ask only for what you need to respond — you can gather the rest later.",
      },
      {
        name: "What happens after submit",
        how: "Submit your own form. You should get a clear confirmation, a fast notification, and the lead should land somewhere you actually check. Test it monthly.",
      },
    ],
  },
  {
    title: "04 — Findability (SEO basics)",
    intro:
      "You don't need to be an SEO expert to catch the fundamentals that decide whether Google can understand and rank your pages.",
    checks: [
      {
        name: "Unique titles & descriptions",
        how: "Each important page needs its own title tag and meta description that say what the page offers. Duplicate or missing titles waste your best search real estate.",
      },
      {
        name: "Heading structure",
        how: "Every page should have exactly one H1 that states its topic, with H2s under it. Headings used as styling (rather than structure) confuse both readers and search engines.",
      },
      {
        name: "Local presence is consistent",
        how: "Your business name, phone number and city should match across your site footer, your Google Business Profile and any directory listings. Mismatches dilute local rankings.",
      },
    ],
  },
  {
    title: "05 — Trust signals",
    intro:
      "Visitors are deciding whether to hand you money. These checks measure how much evidence you give them.",
    checks: [
      {
        name: "Real photos over stock",
        how: "Stock photography is instantly recognisable and quietly erodes trust. Even imperfect real photos of you, your team and your work outperform polished stock.",
      },
      {
        name: "Proof is recent and specific",
        how: "Reviews, case studies and portfolio pieces should be current. Testimonials from years ago, or with no name or context, read as stale or invented.",
      },
      {
        name: "The boring stuff works",
        how: "HTTPS padlock, no broken links, no placeholder pages, no outdated copyright year. Small breakages signal a business that doesn't sweat details.",
      },
    ],
  },
];

function WebsiteAuditChecklistGuide() {
  const total = GROUPS.reduce((n, g) => n + g.checks.length, 0);
  return (
    <GuideArticle
      kicker="GUIDE — WEBSITE AUDIT"
      title="The 15-point website audit checklist"
      lede="This is the same checklist I run before quoting any redesign. It takes about 30 minutes, needs no tools beyond a phone and a browser, and will tell you whether your website is quietly costing you customers."
      dateLabel="AUG 23, 2026"
      readTime="8 MIN READ"
      cta={{
        kicker: "WANT IT DONE FOR YOU?",
        heading: "Get the video version, free",
        body: "Send me your URL and I'll record a 5-minute teardown of your homepage, mobile UX and conversion flow — this exact checklist, applied to your site. No call, no pitch.",
        primary: { label: "CLAIM YOUR FREE AUDIT", to: "/audit" },
        secondary: { label: "SEE SERVICES", to: "/services" },
      }}
      related={[
        {
          title: "How much does a website cost in Houston?",
          blurb: "Real 2026 prices — including mine — and what actually drives the number.",
          to: "/guides/houston-website-cost",
        },
        {
          title: "Squarespace vs a custom website",
          blurb: "The honest three-year cost comparison nobody on either side gives you.",
          to: "/guides/squarespace-vs-custom-website",
        },
      ]}
    >
      <GuideSection title="How to use this checklist">
        <GuideParagraph>
          Work through the {total} checks in order and mark each as pass or fail. Don't fix anything
          yet — the goal is an honest score, not a heroic afternoon. At the end, the scoring guide
          below tells you what your number means.
        </GuideParagraph>
      </GuideSection>

      {GROUPS.map((group) => (
        <GuideSection key={group.title} title={group.title}>
          <GuideParagraph>{group.intro}</GuideParagraph>
          <ul className="mt-8 space-y-4">
            {group.checks.map((check) => (
              <li
                key={check.name}
                className="border-l-2 border-[#FF3333]/60 bg-white/[0.02] py-4 pl-5 pr-4"
              >
                <p className="flex items-start gap-2 font-display text-base uppercase text-white">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#FF3333]" />
                  {check.name}
                </p>
                <p className="mt-2 font-mono text-xs leading-relaxed text-white/60 md:text-sm">
                  {check.how}
                </p>
              </li>
            ))}
          </ul>
        </GuideSection>
      ))}

      <GuideSection title="Scoring yourself">
        <GuideParagraph>
          0–3 failures: your site is fundamentally healthy — tune, don't rebuild. 4–7 failures:
          you're leaking enquiries every week, and a focused audit will pay for itself. 8 or more:
          the site is actively working against the business, and patching individual items will
          cost more in the long run than fixing the foundation.
        </GuideParagraph>
        <div className="mt-6 border border-white/10 bg-white/[0.02] p-6">
          <p className="font-mono text-xs leading-relaxed text-white/60 md:text-sm">
            If you scored 4 or above, the fastest next step is a{" "}
            <a href="/audit" className="text-[#FF3333] underline underline-offset-4">
              free 5-minute video audit
            </a>{" "}
            — I'll show you exactly which failures are costing the most. If your score also made
            you curious about budget, here's{" "}
            <a
              href="/guides/houston-website-cost"
              className="text-[#FF3333] underline underline-offset-4"
            >
              what a website actually costs in Houston
            </a>{" "}
            before you talk to anyone.
          </p>
        </div>
      </GuideSection>
    </GuideArticle>
  );
}
