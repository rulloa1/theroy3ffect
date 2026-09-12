import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { WorkGrid } from "@/components/WorkGrid";

const TITLE = "Selected Work — The Roy Effect";
const DESCRIPTION = "Selected studio work across brand, UI/UX and no-code build by Houston creative director Rory Ulloa. Named client projects shown on the call, with permission.";

export const Route = createFileRoute("/work")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://theroyeffect.com/work" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://theroyeffect.com/work" }],
  }),
  component: WorkPage,
});

function WorkPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-5 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-7xl">
        <Logo variant="compact" size="md" href="/" className="mb-12" />
        <span className="font-mono text-xs tracking-widest text-[#dfba73]">WORK</span>
        <h1 className="mt-3 max-w-3xl font-display text-5xl uppercase leading-[0.9] text-white md:text-7xl">Work built around the next action</h1>
        <p className="mt-5 max-w-2xl font-mono text-base leading-[1.6] text-white/90">Selected studio work across brand, UI/UX and no-code build. Named client projects are shown on the call, with permission.</p>
        <div className="mt-12"><WorkGrid /></div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/audit" className="inline-flex min-h-11 items-center bg-[#dfba73] px-5 py-3 font-mono text-xs font-bold tracking-widest text-black">GET YOUR FREE AUDIT</Link>
          <Link to="/book" className="inline-flex min-h-11 items-center border border-white/40 px-5 py-3 font-mono text-xs tracking-widest text-white">BOOK A DISCOVERY CALL</Link>
        </div>
      </div>
    </main>
  );
}