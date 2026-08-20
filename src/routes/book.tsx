import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { ParticleBackground } from "@/components/ParticleBackground";
import { SiteHeader, type NavTarget } from "@/components/SiteHeader";
import { BookingCalendar } from "@/components/BookingCalendar";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book a Discovery Call — The Roy Effect" },
      {
        name: "description",
        content:
          "Schedule a free 15-minute discovery call with Rory Ulloa, a Houston creative director and UI/UX designer. Pick a time and we’ll talk through your project.",
      },
      {
        property: "og:title",
        content: "Book a Discovery Call — The Roy Effect",
      },
      {
        property: "og:description",
        content:
          "Schedule a free 15-minute discovery call with Rory Ulloa, Houston creative director and UI/UX designer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://www.theroyeffect.com/book" }],
  }),
  component: BookPage,
});

function BookPage() {
  const navigate = useNavigate();

  const handleNavigate = (target: NavTarget) => {
    if (target === "LET'S WORK") {
      navigate({ to: "/", hash: "contact" });
    } else {
      navigate({ to: "/" });
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#030014]">
      <ParticleBackground />
      <SiteHeader onNavigate={handleNavigate} />

      <section className="relative z-10 flex-1 px-5 pt-32 pb-20 md:px-10 md:pt-40">
        <div className="mx-auto max-w-5xl">
          <span className="font-mono text-xs tracking-widest text-[#FF3333]">
            15-MINUTE DISCOVERY CALL
          </span>
          <h1 className="mt-3 font-display text-4xl uppercase leading-[0.9] text-white md:text-6xl lg:text-7xl">
            Book a time to talk
          </h1>
          <p className="mt-4 max-w-2xl font-mono text-sm leading-relaxed text-white/60">
            Pick a slot below. I&apos;ll call you at the scheduled time to discuss your project, scope, and
            timeline.
          </p>
          <div className="mt-10">
            <BookingCalendar />
          </div>
        </div>
      </section>
      <Toaster />
    </main>
  );
}
