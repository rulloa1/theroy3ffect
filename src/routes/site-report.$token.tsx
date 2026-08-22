import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Check, Info, TriangleAlert } from "lucide-react";
import { Logo } from "@/components/Logo";
import { getSiteReport } from "@/utils/site-report.functions";

export const Route = createFileRoute("/site-report/$token")({
  loader: async ({ params }) => {
    const report = await getSiteReport({ data: { token: params.token } });
    if (!report) throw notFound();
    return report;
  },
  head: () => ({
    meta: [
      { title: "Your Website Report | The Roy Effect" },
      {
        name: "description",
        content:
          "A free, personalized review of your website: what is costing you customers today and what to fix first, from Houston designer Rory Ulloa.",
      },
      { property: "og:title", content: "Your Website Report | The Roy Effect" },
      {
        property: "og:description",
        content: "A free, personalized review of what your website is costing you and what to fix first.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SiteReportPage,
  errorComponent: () => <ReportMessage title="This report could not be loaded" />,
  notFoundComponent: () => <ReportMessage title="This report link is no longer active" />,
});

function ReportMessage({ title }: { title: string }) {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo className="h-8 w-auto" />
      <h1 className="text-2xl font-bold uppercase tracking-tight">{title}</h1>
      <Link
        to="/audit"
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold uppercase text-primary-foreground"
      >
        Request a free audit <ArrowRight className="h-4 w-4" />
      </Link>
    </main>
  );
}

const SEVERITY = {
  critical: { icon: AlertTriangle, className: "text-destructive", label: "Urgent" },
  warning: { icon: TriangleAlert, className: "text-primary", label: "Costing you" },
  info: { icon: Info, className: "text-muted-foreground", label: "Worth fixing" },
} as const;

function SiteReportPage() {
  const report = Route.useLoaderData();
  const grade =
    report.painScore >= 40 ? "Critical" : report.painScore >= 20 ? "Needs work" : report.painScore > 0 ? "Minor issues" : "Looks solid";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-6 py-14 md:py-20">
        <Logo className="h-7 w-auto" />

        <p className="mt-10 text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Free website report
        </p>
        <h1 className="mt-3 text-4xl font-black uppercase leading-[0.95] tracking-tight md:text-6xl">
          {report.businessName}
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          I looked at how this {report.industryLabel} shows up online from a customer&apos;s point of view. Here is what
          I found, in plain English — nothing to sign up for.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-border px-4 py-2 text-sm font-bold uppercase tracking-wide">
            {grade}
          </span>
          <span className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
            {report.signals.length} issue{report.signals.length === 1 ? "" : "s"} found
          </span>
          {report.loadSeconds !== null && (
            <span className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
              Loads in {report.loadSeconds}s
            </span>
          )}
          {report.website && (
            <span className="truncate rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
              {report.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </span>
          )}
        </div>

        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-bold uppercase tracking-tight">What I found</h2>
          {report.signals.length === 0 ? (
            <p className="flex items-start gap-3 rounded-xl border border-border p-5 text-muted-foreground">
              <Check className="mt-0.5 h-5 w-5 text-primary" />
              No blocking issues turned up in the automated pass. The next win is usually positioning and copy, which
              needs a human look.
            </p>
          ) : (
            report.signals.map((signal) => {
              const meta = SEVERITY[signal.severity] ?? SEVERITY.info;
              const Icon = meta.icon;
              return (
                <article key={signal.code} className="rounded-xl border border-border p-5">
                  <div className="flex items-start gap-3">
                    <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${meta.className}`} />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                        {meta.label}
                      </p>
                      <h3 className="mt-1 text-lg font-bold">{signal.label}</h3>
                      <p className="mt-2 text-muted-foreground">{signal.detail}</p>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>

        <section className="mt-14 rounded-2xl border border-primary/40 bg-primary/5 p-8">
          <h2 className="text-2xl font-black uppercase tracking-tight">Want these fixed?</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            I design and build sites for Houston businesses — usually live within two to three weeks. Start with a free
            5-minute video teardown where I walk through these findings and what I would do first.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/audit"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold uppercase text-primary-foreground"
            >
              Get the free teardown <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/book"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-bold uppercase"
            >
              Book a call
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-bold uppercase"
            >
              See pricing
            </Link>
          </div>
        </section>

        <p className="mt-10 text-sm text-muted-foreground">
          Prepared by Rory Ulloa, The Roy Effect, Houston TX
          {report.scannedAt ? ` · checked ${new Date(report.scannedAt).toLocaleDateString()}` : ""}.
        </p>
      </div>
    </main>
  );
}
