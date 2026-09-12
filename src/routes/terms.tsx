import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LEGAL_IDENTITY as L } from "@/lib/legal-identity";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — The Roy Effect" },
      {
        name: "description",
        content:
          "Terms of service for The Roy Effect, including project scope, payment terms and our text messaging program.",
      },
      { property: "og:title", content: "Terms of Service — The Roy Effect" },
      {
        property: "og:description",
        content:
          "Project scope, payment terms and the text messaging program for The Roy Effect.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://theroyeffect.com/terms" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://theroyeffect.com/terms" }],
  }),
  component: TermsPage,
});

function H({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-10 font-display text-xl uppercase tracking-tight text-white">{children}</h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 font-mono text-sm leading-relaxed text-white/70">{children}</p>;
}

function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <SiteHeader onNavigate={() => void navigate({ to: "/" })} />
      <main className="px-5 pb-16 pt-28 md:px-10 md:pt-36">
        <article className="mx-auto max-w-3xl">
          <h1 className="font-display text-4xl uppercase leading-[0.95] text-white md:text-6xl">
            Terms of Service
          </h1>

          <P>
            Last updated: {L.lastUpdated}. These terms govern your use of {L.site} and the services
            provided by {L.legalName}, doing business as {L.dba}.
          </P>

          <H>Our services</H>
          <P>
            We provide website design, brand identity, and build services. Scope, price, and
            timeline for any project are set out in the proposal or invoice we send you. Work
            begins when payment or the agreed deposit clears.
          </P>

          <H>Payment</H>
          <P>
            Invoices are due on receipt unless the invoice states otherwise. Projects quoted with a
            deposit require the deposit before a start date is reserved, with the balance due at
            launch.
          </P>

          <H>Text messaging program</H>
          <ul className="mt-4 list-disc space-y-2 pl-5 font-mono text-sm leading-relaxed text-white/70">
            <li>
              Program: {L.dba} sends appointment confirmations and reminders, project and invoice
              updates, replies to your enquiries, and — where you have separately agreed —
              occasional marketing messages.
            </li>
            <li>
              Consent: You receive messages only after opting in through a form on our website, by
              giving us your number and asking us to text you, or by texting us first. Consent to
              marketing texts is never a condition of buying anything from us.
            </li>
            <li>Frequency: Message frequency varies.</li>
            <li>
              Cost: Message and data rates may apply. We do not charge for the messages themselves.
            </li>
            <li>
              Opting out: Reply STOP to any message to stop receiving texts. You will get one
              confirmation, and no further messages after it.
            </li>
            <li>
              Help: Reply HELP for help, or contact us at {L.email} or {L.phone}.
            </li>
            <li>Carriers: Carriers are not liable for delayed or undelivered messages.</li>
            <li>
              Privacy: Mobile numbers collected for text messaging are handled as described in our
              Privacy Policy, and are never shared with third parties or affiliates for marketing
              or promotional purposes.
            </li>
          </ul>

          <H>Your content</H>
          <P>
            You keep ownership of the logos, photographs, text, and other materials you give us,
            and you confirm you have the right to use them. You give us permission to use them to
            do the work, and to show the finished work in our portfolio unless you ask us in
            writing not to.
          </P>

          <H>Our work</H>
          <P>
            Ownership of the final delivered design transfers to you once the project is paid in
            full. Working files, unused concepts, and any tools or components we reuse across
            projects remain ours.
          </P>

          <H>Limitation of liability</H>
          <P>
            We are not liable for indirect or consequential losses. Our total liability for any
            claim is limited to the amount you paid us for the project the claim relates to.
          </P>

          <H>Governing law</H>
          <P>These terms are governed by the laws of the State of Texas.</P>

          <H>Contact</H>
          <P>
            {L.legalName} d/b/a {L.dba} · {L.city} · {L.email}
          </P>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
