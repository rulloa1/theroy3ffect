import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Asterisk,
  ArrowUpRight,
  Check,
  Mail,
  Phone,
  Sparkles,
  Figma,
  Layers,
  MonitorSmartphone,
  Palette,
  Wand2,
  Star,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import heroPortrait from "@/assets/hero-portrait.jpg";
import { AnimatedBackground } from "@/components/AnimatedBackground";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rory Ulloa — Creative Designer & No-Code Developer" },
      {
        name: "description",
        content:
          "Tokyo-based product designer and no-code developer crafting UI/UX, brand systems and websites that solve problems and drive results.",
      },
      {
        property: "og:title",
        content: "Rory Ulloa — Creative Designer & No-Code Developer",
      },
      {
        property: "og:description",
        content:
          "Portfolio of a Tokyo-based product designer building thoughtful digital products, brand identities and no-code websites.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://pixel-perfect-capture-758.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://pixel-perfect-capture-758.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Person",
              name: "Rory Ulloa",
              jobTitle: "Product Designer & No-Code Developer",
              url: "https://pixel-perfect-capture-758.lovable.app/",
              email: "mailto:rory@theroyeffect.com",
              telephone: "+1-281-323-0450",
              address: { "@type": "PostalAddress", addressLocality: "Tokyo", addressCountry: "JP" },
              knowsAbout: [
                "UI/UX Design",
                "Brand Identity",
                "No-Code Development",
                "Design Systems",
              ],
            },
            {
              "@type": "LocalBusiness",
              name: "The Roy Effect — Rory Ulloa",
              url: "https://pixel-perfect-capture-758.lovable.app/",
              telephone: "+1-281-323-0450",
              email: "mailto:rory@theroyeffect.com",
              address: { "@type": "PostalAddress", addressLocality: "Tokyo", addressCountry: "JP" },
              priceRange: "$$",
            },
          ],
        }),
      },
    ],
  }),
  component: Portfolio,

});

const NAV = [
  { label: "Home", href: "#home" },
  { label: "About us", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "My work", href: "#work" },
  { label: "Testimonial", href: "#testimonial" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQs", href: "#faqs" },
];

const SERVICES = [
  {
    icon: Palette,
    title: "UI / UX Design",
    copy: "End-to-end product design from flows and wireframes to polished, shippable interfaces.",
  },
  {
    icon: Layers,
    title: "Brand Identity",
    copy: "Logos, type systems and visual languages that make a product instantly recognisable.",
  },
  {
    icon: MonitorSmartphone,
    title: "No-Code Development",
    copy: "Fast, responsive marketing sites built in Webflow and Framer — launched in days.",
  },
  {
    icon: Wand2,
    title: "Design Systems",
    copy: "Token-driven component libraries your team can build on without breaking things.",
  },
];

const WORK = [
  { title: "Lumen Finance", tag: "Product Design", year: "2025" },
  { title: "Nori Coffee Co.", tag: "Brand + Webflow", year: "2025" },
  { title: "Pulse Health", tag: "Mobile App", year: "2024" },
  { title: "Arcade Studio", tag: "Design System", year: "2024" },
];

const TESTIMONIALS = [
  {
    quote:
      "Rory rebuilt our onboarding in three weeks. Activation went up 38% and the team finally has a design system it trusts.",
    name: "Amara Okafor",
    role: "Head of Product, Lumen",
  },
  {
    quote:
      "The fastest designer I've worked with who doesn't cut corners. Our site went from figma to live in eight days.",
    name: "Ken Watanabe",
    role: "Founder, Nori Coffee",
  },
];

const PRICING = [
  {
    name: "Starter",
    price: "$1,900",
    period: "/ project",
    blurb: "For a single landing page or a focused design sprint.",
    features: ["1 page design", "Up to 3 revisions", "Figma handoff", "5-day delivery"],
    featured: false,
  },
  {
    name: "Studio",
    price: "$4,500",
    period: "/ month",
    blurb: "An embedded designer for teams shipping continuously.",
    features: [
      "Unlimited requests",
      "Up to 5 revisions",
      "Team-friendly collaboration",
      "Webflow / Framer build",
      "Performance tracking",
    ],
    featured: true,
  },
  {
    name: "Partner",
    price: "Custom",
    period: "",
    blurb: "Full product and brand ownership, long-term.",
    features: ["Design system", "Brand identity", "Weekly strategy calls", "Priority support"],
    featured: false,
  },
];

const FAQS = [
  {
    q: "What services do you offer?",
    a: "UI/UX design, brand identity, design systems and no-code development in Webflow and Framer — whether you're starting from scratch or refreshing what you already have.",
  },
  {
    q: "How long does a project usually take?",
    a: "A landing page is typically 5–8 days. Full product work runs 3–6 weeks depending on scope, with weekly checkpoints so nothing drifts.",
  },
  {
    q: "Can I ask for more revisions if needed?",
    a: "Yes. Every plan includes a set number, and extra rounds can be added at any point — I'd rather get it right than get it done.",
  },
  {
    q: "What tools do you use?",
    a: "Figma for design, Webflow and Framer for build, Notion for project tracking, and Loom for async walkthroughs.",
  },
  {
    q: "Will I need to code anything?",
    a: "No. Everything ships live and editable, and I record a short handoff video showing how to update content yourself.",
  },
];

function Halo({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute halo animate-halo rounded-full ${className}`}
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
      <Asterisk className="size-3 text-neon" />
      {children}
    </span>
  );
}

function Portfolio() {
  const [email, setEmail] = useState("");

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background">
      <AnimatedBackground />
      <Toaster />

      {/* Nav */}
      <header className="fixed inset-x-0 top-4 z-50 px-4">
        <nav className="mx-auto flex max-w-5xl items-center gap-4 rounded-full panel px-3 py-2">
          <span className="relative grid size-9 shrink-0 place-items-center rounded-full [background:var(--gradient-neon)] shadow-[var(--shadow-glow)]">
            <Asterisk className="size-5 text-primary-foreground" />
          </span>
          <ul className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {NAV.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="rounded-full px-3 py-1.5 text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <Button variant="glass" size="sm" className="ml-auto md:ml-0" asChild>
            <a href="#contact">
              <span className="size-1.5 rounded-full bg-signal" />
              Contact Us
            </a>
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <section id="home" className="relative overflow-hidden px-4 pb-24 pt-36 text-center">
        <Halo className="left-1/2 top-24 size-[46rem] -translate-x-1/2 opacity-60" />
        <div className="relative mx-auto max-w-4xl">
          <p className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            <span>Hey! I&apos;m Rory Ulloa</span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-2">
              Based on
              <span className="grid size-5 place-items-center rounded-full [background:var(--gradient-neon)]">
                <span className="size-1.5 rounded-full bg-primary-foreground" />
              </span>
              Tokyo
            </span>
          </p>
          <h1 className="mt-6 text-balance text-5xl font-semibold leading-[1.05] sm:text-6xl md:text-7xl">
            Creative designer
            <br />&amp; No-Code Developer
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-muted-foreground">
            I build designs that solve problems, inspire action, and drive success.
          </p>

          <div className="relative mx-auto mt-16 w-full max-w-sm">
            {/* rotating conic ring */}
            <div
              aria-hidden
              className="absolute -inset-6 rounded-full ring-conic animate-spin-slow opacity-70 blur-2xl"
            />
            {/* arched portrait frame */}
            <div className="relative overflow-hidden rounded-t-full rounded-b-[2.5rem] border border-neon/30 bg-surface p-1.5 shadow-[var(--shadow-glow)]">
              <img
                src={heroPortrait}
                width={1024}
                height={1280}
                alt="Rory Ulloa lit by a red neon halo"
                className="w-full rounded-t-full rounded-b-[2rem] object-cover"
              />
              {/* sheen sweep */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-foreground/10 to-transparent animate-sheen"
              />
              {/* bottom fade + caption */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 rounded-b-[2rem] bg-gradient-to-t from-background via-background/70 to-transparent" />
              <p className="script absolute inset-x-0 bottom-4 text-center text-3xl text-foreground/90">
                Rory Ulloa&nbsp; &nbsp;-- theroyeffect
              </p>
            </div>

            {/* orbiting accents */}
            <span className="absolute -left-5 top-1/3 grid size-11 place-items-center rounded-2xl [background:var(--gradient-neon)] shadow-[var(--shadow-glow)] animate-float">
              <Asterisk className="size-5 text-primary-foreground" />
            </span>
            <span className="absolute -right-4 bottom-28 -rotate-6 rounded-full bg-signal/15 px-3 py-1 text-xs font-medium text-signal ring-1 ring-signal/40 backdrop-blur animate-float [animation-delay:-3s]">
              • Available as freelancer
            </span>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="relative px-4 py-24">
        <Halo className="-left-40 top-10 size-[30rem] opacity-40" />
        <div className="relative mx-auto grid max-w-5xl gap-12 md:grid-cols-2 md:items-center">
          <div>
            <SectionLabel>I&apos;m Rory Ulloa</SectionLabel>
            <h2 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">
              Hey, <Sparkles className="inline size-7 text-neon-soft" /> I&apos;m a
              <br />
              <span className="text-gradient-neon">product designer</span>
            </h2>
            <p className="mt-6 text-muted-foreground">
              With over 12 years of hands-on experience turning ideas into thoughtful, intuitive
              digital products. I&apos;ve had the chance to work with clients all over the world —
              each project pushing me to design smarter, cleaner, and more meaningful experiences.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { k: "12+", v: "Years experience" },
                { k: "180+", v: "Projects shipped" },
                { k: "40+", v: "Happy clients" },
              ].map((s) => (
                <div key={s.k} className="rounded-2xl panel p-4">
                  <p className="text-2xl font-semibold text-gradient-neon">{s.k}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-xs rounded-[2rem] border border-border p-2 panel">
            <img
              src={heroPortrait}
              width={1024}
              height={1280}
              loading="lazy"
              alt="Portrait of Rory Ulloa"
              className="w-full rounded-[1.6rem] object-cover"
            />
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-signal/20 px-3 py-1 text-xs text-signal ring-1 ring-signal/40">
              • Available as freelancer
            </span>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="relative px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <SectionLabel>Services</SectionLabel>
            <h2 className="mt-5 text-4xl font-semibold sm:text-5xl">What I can do for you</h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              A small, sharp set of services — enough to take a product from idea to live.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {SERVICES.map(({ icon: Icon, title, copy }) => (
              <article
                key={title}
                className="group rounded-3xl panel p-6 transition-all hover:-translate-y-1 hover:border-neon/50 hover:shadow-[var(--shadow-glow)]"
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-surface-2 ring-1 ring-border">
                  <Icon className="size-5 text-neon" />
                </span>
                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Work */}
      <section id="work" className="relative px-4 py-24">
        <Halo className="right-[-10rem] top-20 size-[32rem] opacity-40" />
        <div className="relative mx-auto max-w-5xl">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <SectionLabel>Selected work</SectionLabel>
              <h2 className="mt-5 text-4xl font-semibold sm:text-5xl">Recent projects</h2>
            </div>
            <Button variant="glass" asChild>
              <a href="#contact">
                Start a project <ArrowUpRight />
              </a>
            </Button>
          </div>
          <ul className="mt-12 divide-y divide-border overflow-hidden rounded-3xl panel">
            {WORK.map((p) => (
              <li key={p.title}>
                <a
                  href="#contact"
                  className="group flex items-center gap-4 px-6 py-6 transition-colors hover:bg-secondary/60"
                >
                  <Figma className="size-4 text-neon" />
                  <span className="text-lg font-medium">{p.title}</span>
                  <span className="ml-auto hidden text-sm text-muted-foreground sm:block">
                    {p.tag}
                  </span>
                  <span className="text-sm text-muted-foreground">{p.year}</span>
                  <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-neon" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Testimonial */}
      <section id="testimonial" className="relative px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <SectionLabel>Testimonial</SectionLabel>
            <h2 className="mt-5 text-4xl font-semibold sm:text-5xl">Kind words</h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="rounded-3xl panel p-7">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-4 fill-neon text-neon" />
                  ))}
                </div>
                <blockquote className="mt-5 text-lg leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{t.name}</span> — {t.role}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative px-4 py-24">
        <Halo className="left-1/2 top-1/3 size-[38rem] -translate-x-1/2 opacity-40" />
        <div className="relative mx-auto max-w-5xl">
          <div className="text-center">
            <SectionLabel>Pricing</SectionLabel>
            <h2 className="mt-5 text-4xl font-semibold sm:text-5xl">Simple, honest plans</h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {PRICING.map((p) => (
              <article
                key={p.name}
                className={`flex flex-col rounded-3xl panel p-7 ${
                  p.featured ? "border-neon/60 shadow-[var(--shadow-glow)] md:-translate-y-3" : ""
                }`}
              >
                <p className="text-sm uppercase tracking-widest text-muted-foreground">{p.name}</p>
                <p className="mt-3 text-4xl font-semibold">
                  {p.price}
                  <span className="text-base font-normal text-muted-foreground">{p.period}</span>
                </p>
                <p className="mt-3 text-sm text-muted-foreground">{p.blurb}</p>
                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-signal" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button variant={p.featured ? "neon" : "pill"} className="mt-7" asChild>
                  <a href="#contact">Get started</a>
                </Button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faqs" className="relative px-4 py-24">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <h2 className="text-4xl font-semibold sm:text-5xl">FAQs</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              A few common questions, answered simply.
            </p>
          </div>
          <Accordion type="single" collapsible className="mt-10 space-y-3">
            {FAQS.map((f, i) => (
              <AccordionItem
                key={f.q}
                value={`item-${i}`}
                className="rounded-2xl panel px-5 border-b-0"
              >
                <AccordionTrigger className="text-left text-sm hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Newsletter */}
      <section className="relative px-4 py-16">
        <div className="relative mx-auto max-w-2xl overflow-hidden rounded-[2rem] panel p-8 text-center">
          <Halo className="left-1/2 top-40 size-80 -translate-x-1/2 opacity-70" />
          <h2 className="relative text-3xl font-semibold">
            Join our creatives
            <br />
            growing their brand
          </h2>
          <p className="relative mt-3 text-sm text-muted-foreground">
            Quick tips, fresh updates — straight to your inbox.
          </p>
          <form
            className="relative mx-auto mt-6 flex max-w-sm gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!email) return;
              toast.success("You're subscribed. Talk soon!");
              setEmail("");
            }}
          >
            <Input
              type="email"
              required
              aria-label="Email address for newsletter"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="h-11 rounded-full bg-surface-2 px-5"
            />
            <Button
              type="submit"
              variant="neon"
              size="icon"
              aria-label="Subscribe to the newsletter"
              className="size-11 shrink-0"
            >
              <ArrowUpRight />
            </Button>

          </form>
          <p className="relative mt-3 text-xs text-muted-foreground">
            One email a month. No spam, ever.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="relative px-4 py-24">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-4xl font-semibold sm:text-5xl">Let&apos;s work together</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Drop me a message or reach out directly — I&apos;ll get back within a day.
          </p>
          <form
            className="mt-8 space-y-3 text-left"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Message sent — thanks for reaching out!");
              (e.currentTarget as HTMLFormElement).reset();
            }}
          >
            <Input
              required
              aria-label="Full name"
              placeholder="Full name"
              className="h-12 rounded-2xl bg-surface-2 px-5"
            />
            <Input
              required
              type="email"
              aria-label="Email address"
              placeholder="Enter your email"
              className="h-12 rounded-2xl bg-surface-2 px-5"
            />
            <Textarea
              required
              rows={4}
              aria-label="Your message"
              placeholder="Write a message here..."
              className="rounded-2xl bg-surface-2 px-5 py-4"
            />

            <Button type="submit" variant="neon" size="lg" className="w-full">
              Send message
            </Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-12">
        <div className="mx-auto flex max-w-5xl flex-wrap items-start justify-between gap-8 text-sm">
          <div>
            <p className="text-muted-foreground">Say hello!</p>
            <a
              href="tel:+12813230450"
              className="mt-3 flex items-center gap-2 transition-colors hover:text-neon"
            >
              <Phone className="size-4 text-neon" /> (281) 323-0450
            </a>
            <a
              href="mailto:rory@theroyeffect.com"
              className="mt-2 flex items-center gap-2 transition-colors hover:text-neon"
            >
              <Mail className="size-4 text-neon" /> rory@theroyeffect.com
            </a>
          </div>
          <div className="text-muted-foreground">
            <p>Designed &amp; built in Tokyo</p>
            <p className="mt-2">© {new Date().getFullYear()} Rory Ulloa.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
