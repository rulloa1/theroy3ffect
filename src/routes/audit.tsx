import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Check, QrCode, Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Free Website Audit for Houston Small Businesses" },
      {
        name: "description",
        content:
          "Get a free 5-minute website audit: a personal video teardown of your conversion rate, mobile experience and brand positioning, for Houston small businesses and service providers.",
      },
      { property: "og:title", content: "Free Website Audit for Houston Small Businesses" },
      {
        property: "og:description",
        content:
          "A free 5-minute video teardown of your website's conversion rate, mobile UX and brand positioning — by Houston designer Rory Ulloa.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.theroyeffect.com/audit" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.theroyeffect.com/audit" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Free Website Audit",
          serviceType: "Website audit and conversion review",
          provider: {
            "@type": "LocalBusiness",
            name: "The Roy Effect",
            email: "rory@theroyeffect.com",
            areaServed: "Houston, Texas",
            url: "https://www.theroyeffect.com",
          },
          areaServed: { "@type": "City", name: "Houston" },
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          url: "https://www.theroyeffect.com/audit",
        }),
      },
    ],
  }),
  component: AuditPage,
});

const auditSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid work email").max(255),
  websiteUrl: z.string().trim().min(3, "Please enter your website URL").max(255),
  bottleneck: z.string().trim().min(1, "Select your primary bottleneck"),
  notes: z.string().trim().max(1000).optional(),
});

export function AuditPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [bottleneck, setBottleneck] = useState("Conversion Rate & Inbound Leads");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = auditSchema.safeParse({ name, email, websiteUrl, bottleneck, notes });
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Please check the form");
      return;
    }

    setSending(true);
    try {
      const response = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: result.data.name,
          email: result.data.email,
          projectType: "5-Minute Website Audit",
          message: `[5-MINUTE AUDIT REQUEST]\nWebsite: ${result.data.websiteUrl}\nPrimary Bottleneck: ${result.data.bottleneck}\nNotes: ${result.data.notes || "None provided"}`,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Failed to submit request");

      setSubmitted(true);
      toast.success("Audit request received! Rory will send your video teardown within 24 hours.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#030014] px-5 py-16 text-white md:px-10 md:py-24">
      <Toaster />
      <div className="mx-auto max-w-4xl">
        {/* Top Header & Logo */}
        <div className="flex flex-col items-center justify-center text-center">
          <Logo variant="stacked" size="lg" href="/" className="mb-6" />
          <div className="mt-2 inline-flex items-center gap-2 border border-[#DFBA73]/30 bg-[#DFBA73]/10 px-3 py-1 font-mono text-[10px] font-bold tracking-[0.25em] text-[#F6DC9A] uppercase">
            <Sparkles className="size-3" />
            THE 5-MINUTE AUDIT &bull; COMPLIMENTARY TEARDOWN
          </div>

          <h1 className="mt-6 font-display text-4xl uppercase leading-[0.9] text-white sm:text-6xl md:text-7xl">
            Free Website Audit <br />
            <span className="text-[#E51924] drop-shadow-[0_0_24px_rgba(229,25,36,0.4)]">
              For Houston Businesses
            </span>
          </h1>

          <p className="mt-5 max-w-xl font-mono text-xs leading-relaxed text-white/60 sm:text-sm">
            Most local service websites in Houston look dated, load slowly on phones, and send
            high-paying clients straight to a competitor. Send me your URL and I'll record a free
            5-minute video breaking down your UX bottlenecks and conversion leaks — no sales call,
            no obligation.
          </p>
        </div>

        {/* 3 Core Value Pillars */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Conversion Teardown",
              desc: "Pinpoint exact friction points where visitors bounce before filling out your form or calling.",
              tag: "STEP 1",
            },
            {
              title: "Mobile & Brand Score",
              desc: "Full evaluation of mobile responsiveness, typographic hierarchy, and premium perceived value.",
              tag: "STEP 2",
            },
            {
              title: "3 Actionable Fixes",
              desc: "A personalized 5-minute video report with exact changes to increase inquiries immediately.",
              tag: "STEP 3",
            },
          ].map((pillar) => (
            <div
              key={pillar.title}
              className="border border-white/10 bg-white/[0.02] p-5 transition-all hover:border-[#DFBA73]/40"
            >
              <span className="font-mono text-[10px] tracking-widest text-[#DFBA73]">
                {pillar.tag}
              </span>
              <h3 className="mt-2 font-display text-xl uppercase text-white">{pillar.title}</h3>
              <p className="mt-2 font-mono text-xs leading-relaxed text-white/50">{pillar.desc}</p>
            </div>
          ))}
        </div>

        {/* Audit Request Form / Confirmation */}
        <div className="mt-12 border border-white/15 bg-white/[0.02] p-6 md:p-10 shadow-2xl">
          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-[#DFBA73] bg-[#DFBA73]/10 text-[#DFBA73]">
                <Check className="size-7" />
              </div>
              <h2 className="font-display text-3xl uppercase text-white">AUDIT REQUEST RECEIVED</h2>
              <p className="mx-auto max-w-md font-mono text-xs leading-relaxed text-white/60">
                Thanks, <strong>{name}</strong>. Rory Ulloa is reviewing{" "}
                <strong>{websiteUrl}</strong> and will email your personalized teardown within 1
                business day.
              </p>
              <div className="pt-4">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 bg-[#E51924] px-6 py-3 font-mono text-xs font-bold tracking-widest text-white hover:bg-[#FF3333]"
                >
                  EXPLORE THE STUDIO ↗
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border-b border-white/10 pb-4">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#DFBA73]">
                  CLAIM YOUR COMPLIMENTARY SPOT
                </span>
                <h2 className="mt-1 font-display text-2xl uppercase text-white sm:text-3xl">
                  REQUEST YOUR 5-MINUTE TEARDOWN
                </h2>
                <p className="mt-1 font-mono text-xs text-white/50">
                  100% free • No sales calls required • Delivered straight to your inbox
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="audit-url"
                    className="block font-mono text-[11px] uppercase tracking-wider text-white/70"
                  >
                    Your Website URL *
                  </label>
                  <input
                    id="audit-url"
                    type="text"
                    required
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourbusiness.com"
                    className="mt-2 w-full border border-white/15 bg-[#030014] p-3 font-mono text-xs text-white placeholder:text-white/30 focus:border-[#DFBA73] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="audit-name"
                    className="block font-mono text-[11px] uppercase tracking-wider text-white/70"
                  >
                    Your Name *
                  </label>
                  <input
                    id="audit-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="mt-2 w-full border border-white/15 bg-[#030014] p-3 font-mono text-xs text-white placeholder:text-white/30 focus:border-[#DFBA73] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="audit-email"
                    className="block font-mono text-[11px] uppercase tracking-wider text-white/70"
                  >
                    Your Work Email * (Where we send the audit)
                  </label>
                  <input
                    id="audit-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@yourbusiness.com"
                    className="mt-2 w-full border border-white/15 bg-[#030014] p-3 font-mono text-xs text-white placeholder:text-white/30 focus:border-[#DFBA73] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="audit-bottleneck"
                    className="block font-mono text-[11px] uppercase tracking-wider text-white/70"
                  >
                    Biggest Challenge / Goal *
                  </label>
                  <select
                    id="audit-bottleneck"
                    value={bottleneck}
                    onChange={(e) => setBottleneck(e.target.value)}
                    className="mt-2 w-full border border-white/15 bg-[#030014] p-3 font-mono text-xs text-[#DFBA73] focus:border-[#DFBA73] focus:outline-none"
                  >
                    <option value="Conversion Rate & Inbound Leads">
                      Low conversion rate & few inquiries
                    </option>
                    <option value="Outdated Visual Identity">
                      Design looks dated compared to competitors
                    </option>
                    <option value="Mobile Experience & Performance">
                      Poor mobile layout / slow loading
                    </option>
                    <option value="Full Rebrand & Launch">
                      Preparing for a major rebrand / new launch
                    </option>
                    <option value="General Teardown">
                      General teardown & high-level recommendations
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="audit-notes"
                  className="block font-mono text-[11px] uppercase tracking-wider text-white/70"
                >
                  Any specific pages or competitors we should look at? (Optional)
                </label>
                <textarea
                  id="audit-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Please look at our services page. Our main competitor is..."
                  className="mt-2 w-full resize-none border border-white/15 bg-[#030014] p-3 font-mono text-xs text-white placeholder:text-white/30 focus:border-[#DFBA73] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
                <div className="flex items-center gap-2 font-mono text-[11px] text-white/50">
                  <ShieldCheck className="size-4 text-[#DFBA73]" />
                  <span>Strictly confidential. No spam or sales pressure.</span>
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-2 bg-[#E51924] px-8 py-3.5 font-mono text-xs font-bold tracking-widest text-white transition-all hover:bg-[#FF3333] hover:shadow-[0_0_24px_rgba(229,25,36,0.6)] disabled:opacity-50"
                >
                  {sending ? "SUBMITTING..." : "GET FREE 5-MINUTE AUDIT →"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Who it's for */}
        <section className="mt-16">
          <h2 className="font-display text-2xl uppercase text-white sm:text-3xl">
            Who the audit is for
          </h2>
          <p className="mt-3 max-w-2xl font-mono text-xs leading-relaxed text-white/60">
            I work mostly with owner-run businesses around Houston — contractors, clinics, law and
            accounting practices, salons, restaurants, real estate agents and B2B service firms.
            If people find you, look at the site, and still call someone else, the audit shows you
            where that happens.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              "Your site was built years ago and hasn't kept up with competitors",
              "Most of your traffic is mobile but the layout fights small screens",
              "You get visits from Google Business Profile but almost no form fills",
              "You're about to spend on ads and want the landing experience checked first",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 border border-white/10 bg-white/[0.02] p-4 font-mono text-xs leading-relaxed text-white/60"
              >
                <Zap className="mt-0.5 size-3.5 shrink-0 text-[#DFBA73]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* What happens next */}
        <section className="mt-14">
          <h2 className="font-display text-2xl uppercase text-white sm:text-3xl">
            What happens after you submit
          </h2>
          <ol className="mt-5 space-y-4">
            {[
              "I open your site the way a customer would — on a phone first, cold, with no context.",
              "I record a 5-minute screen video walking through what's confusing, slow or off-brand.",
              "You get the video by email within one business day, plus three fixes ranked by impact.",
              "If you want me to make those fixes, we talk. If not, the notes are yours to keep.",
            ].map((step, i) => (
              <li key={step} className="flex gap-4">
                <span className="font-display text-2xl text-[#E51924]">0{i + 1}</span>
                <p className="font-mono text-xs leading-relaxed text-white/60">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        <section className="mt-14">
          <h2 className="font-display text-2xl uppercase text-white sm:text-3xl">
            Common questions
          </h2>
          <div className="mt-5 space-y-4">
            {[
              {
                q: "Is the website audit really free?",
                a: "Yes. There's no fee and no card. I record a handful of these each week because a few people end up hiring me afterwards — that's the whole business case.",
              },
              {
                q: "How long does it take to get the audit?",
                a: "Usually within one business day, occasionally two if the queue is full. It arrives as a private video link in your inbox.",
              },
              {
                q: "Do I have to be in Houston?",
                a: "No. I'm based in Houston and know the local market best, but I audit and build for clients anywhere in the US.",
              },
              {
                q: "What if I don't have a website yet?",
                a: "Send the closest thing you have — a social profile, a directory listing, or a competitor you admire — and I'll review positioning instead of layout.",
              },
            ].map((faq) => (
              <div key={faq.q} className="border border-white/10 bg-white/[0.02] p-5">
                <h3 className="font-display text-lg uppercase text-white">{faq.q}</h3>
                <p className="mt-2 font-mono text-xs leading-relaxed text-white/60">{faq.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 border border-[#DFBA73]/40 px-6 py-3 font-mono text-xs font-bold tracking-widest text-[#F6DC9A] transition-all hover:bg-[#DFBA73] hover:text-black"
            >
              SEE PRICING <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </section>

        {/* Footer info */}
        <div className="mt-16 text-center">
          <p className="font-mono text-xs text-white/40">
            THE ROY EFFECT &bull; DIRT, REFINED INTO GOLD &bull;{" "}
            <a href="mailto:rory@theroyeffect.com" className="text-[#DFBA73] hover:underline">
              rory@theroyeffect.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
