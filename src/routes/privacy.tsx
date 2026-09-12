import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LEGAL_IDENTITY as L } from "@/lib/legal-identity";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — The Roy Effect" },
      {
        name: "description",
        content:
          "How The Roy Effect collects, uses and protects your information, including mobile numbers and text messaging consent.",
      },
      { property: "og:title", content: "Privacy Policy — The Roy Effect" },
      {
        property: "og:description",
        content:
          "How The Roy Effect collects, uses and protects your information, including text messaging consent.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://theroyeffect.com/privacy" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://theroyeffect.com/privacy" }],
  }),
  component: PrivacyPage,
});

function H({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-10 font-display text-xl uppercase tracking-tight text-white">{children}</h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 font-mono text-sm leading-relaxed text-white/70">{children}</p>;
}

function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mt-4 list-disc space-y-2 pl-5 font-mono text-sm leading-relaxed text-white/70">
      {children}
    </ul>
  );
}

function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <SiteHeader onNavigate={() => void navigate({ to: "/" })} />
      <main className="px-5 pb-16 pt-28 md:px-10 md:pt-36">
        <article className="mx-auto max-w-3xl">
          <h1 className="font-display text-4xl uppercase leading-[0.95] text-white md:text-6xl">
            Privacy Policy
          </h1>

          <P>
            Last updated: {L.lastUpdated}. This policy explains how {L.legalName}, doing business
            as {L.dba} (&quot;we&quot;, &quot;us&quot;), collects and uses information at {L.site}.
          </P>

          <H>Information we collect</H>
          <UL>
            <li>
              Information you give us: your name, email address, phone number, business name, and
              anything you write in a form, booking, or message.
            </li>
            <li>
              Information collected automatically: IP address, browser type, pages viewed, and
              referring page, through standard web analytics.
            </li>
          </UL>

          <H>How we use it</H>
          <UL>
            <li>To reply to your enquiry and schedule calls.</li>
            <li>To design, build, and deliver work you have asked us to do.</li>
            <li>To send invoices, project updates, and appointment reminders.</li>
            <li>To send marketing messages, only where you have asked to receive them.</li>
          </UL>

          <H>Mobile information and text messages</H>
          <P>
            No mobile information will be shared with third parties or affiliates for marketing or
            promotional purposes. All other categories exclude text messaging originator opt-in
            data and consent; this information will not be shared with any third parties.
          </P>
          <P>
            We text you only where you have given consent. Message frequency varies. Message and
            data rates may apply. Reply STOP to any message to opt out, or HELP for help. Opting
            out of text messages does not affect email or phone contact.
          </P>

          <H>Who we share information with</H>
          <P>
            We do not sell your information. We share it only with service providers who help us
            operate — our CRM and scheduling platform, our payment processor, and our email and
            hosting providers — and only so they can perform that service for us. We also disclose
            information where the law requires it.
          </P>

          <H>Cookies and analytics</H>
          <P>
            Our site uses cookies and analytics to understand how pages are used. You can block
            cookies in your browser; parts of the site may then work less well.
          </P>

          <H>Keeping and deleting information</H>
          <P>
            We keep information for as long as we are working together and for as long afterwards
            as we need it for tax, legal, and record-keeping purposes. You may ask us to delete
            your information at any time by emailing {L.email}, and we will do so unless we are
            required to keep it.
          </P>

          <H>Your choices</H>
          <P>
            You can ask us what we hold about you, ask for it to be corrected or deleted,
            unsubscribe from email at the bottom of any email, and stop text messages by replying
            STOP.
          </P>

          <H>Children</H>
          <P>
            Our services are for businesses. We do not knowingly collect information from anyone
            under 13.
          </P>

          <H>Changes</H>
          <P>
            If this policy changes, the new version will be posted on this page with a new date at
            the top.
          </P>

          <H>Contact</H>
          <P>
            {L.legalName} d/b/a {L.dba} · {L.city} · {L.email} · {L.phone}
          </P>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
