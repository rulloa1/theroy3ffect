import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { SiteFooter } from "@/components/SiteFooter";

interface GuideCta {
  kicker: string;
  heading: string;
  body: string;
  primary: { label: string; to: string };
  secondary?: { label: string; to: string };
}

interface RelatedGuide {
  title: string;
  blurb: string;
  to: string;
}

interface GuideArticleProps {
  kicker: string;
  title: string;
  lede: string;
  dateLabel: string;
  readTime: string;
  children: ReactNode;
  cta: GuideCta;
  related: RelatedGuide[];
}

/** Shared chrome for /guides/* articles — matches the case-study page's look. */
export function GuideArticle({
  kicker,
  title,
  lede,
  dateLabel,
  readTime,
  children,
  cta,
  related,
}: GuideArticleProps) {
  return (
    <main className="min-h-screen bg-[#030014]">
      <div className="mx-auto max-w-4xl px-5 pt-16 md:px-10 md:pt-24">
        <Logo variant="compact" size="md" href="/" className="mb-10" />

        <span className="font-mono text-xs tracking-widest text-[#FF3333]">{kicker}</span>
        <h1 className="mt-3 font-display text-4xl uppercase leading-[0.9] text-white md:text-6xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl font-mono text-xs leading-relaxed text-white/60 md:text-sm">
          {lede}
        </p>
        <p className="mt-4 font-mono text-[11px] tracking-widest text-white/40">
          BY RORY ULLOA — {dateLabel} — {readTime}
        </p>
      </div>

      {children}

      {/* Closing CTA */}
      <section className="mx-auto mt-20 max-w-4xl px-5 pb-24 md:mt-28 md:px-10 md:pb-16">
        <div className="border border-[#FF3333]/30 bg-[#FF3333]/5 p-8 md:p-12">
          <span className="font-mono text-xs tracking-widest text-[#FF3333]">{cta.kicker}</span>
          <h2 className="mt-3 font-display text-3xl uppercase leading-[0.9] text-white md:text-5xl">
            {cta.heading}
          </h2>
          <p className="mt-4 max-w-xl font-mono text-xs leading-relaxed text-white/60 md:text-sm">
            {cta.body}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={cta.primary.to}
              className="inline-flex items-center gap-2 bg-[#FF3333] px-6 py-4 font-mono text-xs font-bold tracking-widest text-black transition-all hover:bg-[#FF5555]"
            >
              {cta.primary.label}
              <ArrowUpRight className="size-4" />
            </Link>
            {cta.secondary ? (
              <Link
                to={cta.secondary.to}
                className="inline-flex items-center gap-2 border border-white/20 px-6 py-4 font-mono text-xs tracking-widest text-white transition-colors hover:border-[#FF3333] hover:text-[#FF3333]"
              >
                {cta.secondary.label}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {/* Related guides */}
      <section className="mx-auto max-w-4xl px-5 pb-24 md:px-10 md:pb-32">
        <h2 className="font-display text-2xl uppercase leading-[0.95] text-white md:text-3xl">
          Keep reading
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {related.map((r) => (
            <Link
              key={r.to}
              to={r.to}
              className="group border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-[#FF3333]/50"
            >
              <h3 className="font-display text-lg uppercase leading-tight text-white group-hover:text-[#FF3333]">
                {r.title}
              </h3>
              <p className="mt-2 font-mono text-xs leading-relaxed text-white/50">{r.blurb}</p>
              <span className="mt-4 inline-flex items-center gap-1 font-mono text-[11px] tracking-widest text-[#FF3333]">
                READ
                <ArrowUpRight className="size-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

/** Standard section wrapper used inside guide articles. */
export function GuideSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto mt-20 max-w-4xl px-5 md:mt-28 md:px-10">
      <h2 className="font-display text-3xl uppercase leading-[0.95] text-white md:text-4xl">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function GuideParagraph({ children }: { children: ReactNode }) {
  return (
    <p className="max-w-2xl font-mono text-xs leading-relaxed text-white/60 md:text-sm">
      {children}
    </p>
  );
}
