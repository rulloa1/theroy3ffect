import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

const PROMISE_STEPS = [
  { step: "01", title: "Design first", body: "You see the full design before a single page is built." },
  { step: "02", title: "Sign-off in writing", body: "Nothing moves to build until you've approved it." },
  { step: "03", title: "What you approved is what ships", body: "No surprises at launch. Change requests are yours to make, not mine." },
];

export function ApprovalPromise() {
  return (
    <section className="relative z-20 border-t border-white/10 bg-[#0a0620] px-5 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-7xl">
        <span className="font-mono text-xs tracking-widest text-[#DFBA73]">THE APPROVAL PROMISE</span>
        <h2 className="mt-3 max-w-4xl font-display text-4xl uppercase leading-[0.95] text-white md:text-6xl">
          You approve the design. That design is what goes live.
        </h2>
        <p className="mt-5 max-w-2xl font-mono text-sm leading-relaxed text-white/60">
          No bait-and-switch between the mockup and the build. You sign off on the design before any build work starts, and the site that launches is the one you approved. If something changes, it&apos;s because you asked for it.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PROMISE_STEPS.map(({ step, title, body }) => (
            <div key={step} className="relative border border-white/10 bg-white/[0.02] p-6">
              <span className="absolute right-4 top-3 font-display text-5xl text-white/5">{step}</span>
              <h3 className="font-display text-xl uppercase text-white">{title}</h3>
              <p className="mt-2 font-mono text-xs leading-relaxed text-white/60">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <Link to="/audit" className="inline-flex items-center gap-2 bg-[#FF3333] px-5 py-3 font-mono text-[11px] font-bold tracking-widest text-black transition-colors hover:bg-[#FF5555]">
            START WITH THE FREE AUDIT <ArrowUpRight className="size-4" />
          </Link>
          <a href="/#pricing" className="font-mono text-xs tracking-widest text-[#DFBA73] hover:text-white">
            SEE THE INVESTMENT →
          </a>
        </div>
      </div>
    </section>
  );
}
