import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CalendarClock,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  Receipt,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/clients")({
  head: () => ({
    meta: [
      { title: "Client Portal — theroyeffect.com" },
      {
        name: "description",
        content:
          "One private dashboard for your theroyeffect project: live timeline, milestones, deliverables and invoices. Sign in with the email on your project.",
      },
      { property: "og:title", content: "Client Portal — theroyeffect.com" },
      {
        property: "og:description",
        content:
          "Track your project timeline, milestones, deliverables and invoices in one private dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClientsPage,
});

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Project overview",
    body: "Status, progress and what's up next — always current, never buried in email threads.",
  },
  {
    icon: CalendarClock,
    title: "Timeline & milestones",
    body: "Every milestone with due and completed dates, plus deliverable links as they ship.",
  },
  {
    icon: Receipt,
    title: "Invoices in one place",
    body: "Commission and retainer invoices with paid and balance totals, no hunting through your inbox.",
  },
  {
    icon: FileText,
    title: "Deliverables on tap",
    body: "Final files, briefs and reports attached to the milestones they belong to.",
  },
];

function ClientsPage() {
  const { user, loading } = useAuth();
  const signedIn = !loading && Boolean(user);

  return (
    <main className="min-h-screen bg-[#030014] px-5 pb-24 pt-28 text-white sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex justify-center">
          <Logo variant="stacked" size="md" href="/" />
        </div>

        <div className="mt-14 text-center">
          <span className="font-mono text-[10px] tracking-widest text-[#DFBA73]">
            CLIENT PORTAL
          </span>
          <h1 className="mt-4 font-display text-5xl uppercase leading-[0.9] sm:text-6xl">
            YOUR PROJECT,
            <br />
            <span className="text-[#FF3333]">ONE DASHBOARD</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl font-mono text-sm leading-relaxed text-white/50">
            Timelines, milestones, deliverables and invoices — everything about your project in
            one private place. Sign in with the email address on your project.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {signedIn ? (
              <Link
                to="/portal"
                className="inline-flex items-center gap-2 bg-[#FF3333] px-6 py-3.5 font-mono text-xs font-bold tracking-widest text-black transition-opacity hover:opacity-90"
              >
                OPEN YOUR DASHBOARD <ArrowUpRight className="size-3.5" />
              </Link>
            ) : (
              <Link
                to="/portal/login"
                className="inline-flex items-center gap-2 bg-[#FF3333] px-6 py-3.5 font-mono text-xs font-bold tracking-widest text-black transition-opacity hover:opacity-90"
              >
                <LockKeyhole className="size-3.5" /> SIGN IN TO YOUR PORTAL
              </Link>
            )}
            <Link
              to="/book"
              className="inline-flex items-center gap-2 border border-white/20 px-6 py-3.5 font-mono text-xs tracking-widest text-white/70 transition-colors hover:border-[#FF3333] hover:text-white"
            >
              NOT A CLIENT YET? BOOK A CALL
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="border border-white/10 bg-white/[0.02] p-6">
              <f.icon className="size-5 text-[#FF3333]" />
              <h2 className="mt-4 font-mono text-xs font-bold tracking-widest text-white">
                {f.title.toUpperCase()}
              </h2>
              <p className="mt-2 font-mono text-xs leading-relaxed text-white/45">{f.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-14 text-center font-mono text-[11px] leading-relaxed text-white/35">
          Don&apos;t have access yet? Email{" "}
          <a href="mailto:rory@theroyeffect.com" className="text-[#FF3333] underline">
            rory@theroyeffect.com
          </a>{" "}
          and I&apos;ll set your portal up.
        </p>
      </div>
    </main>
  );
}
