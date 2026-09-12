import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

export function HeroContent() {
  return (
    <div className="pointer-events-none relative z-20 flex min-h-[42rem] w-full flex-col justify-start px-5 pt-28 sm:px-8 md:min-h-screen md:justify-center md:px-10 md:pt-24">
      <div className="mx-auto w-full max-w-7xl">
      <div className="max-w-3xl">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#DFBA73] sm:text-xs">Houston · brand, UI/UX, no-code build</p>
      <h1 className="mt-4 max-w-3xl font-display text-[2.75rem] uppercase leading-[0.92] text-white sm:text-6xl md:text-7xl lg:text-8xl">
        A website that looks expensive and actually asks for the sale.
      </h1>
      <p className="mt-5 max-w-2xl font-mono text-xs leading-relaxed text-white/70 sm:text-sm">
        I&apos;m Rory Ulloa. I design and ship high-contrast sites for founders and local service businesses. You approve the design. That design is what goes live.
      </p>
      <div className="pointer-events-auto mt-6 flex flex-wrap gap-3">
        <Link to="/audit" className="inline-flex items-center gap-2 bg-[#FF3333] px-5 py-3 font-mono text-[11px] font-bold tracking-widest text-black transition-colors hover:bg-[#FF5555]">
          GET A FREE 5-MINUTE AUDIT <ArrowUpRight className="size-4" />
        </Link>
        <Link to="/work" className="hidden items-center gap-2 border border-white/20 px-5 py-3 font-mono text-[11px] tracking-widest text-white transition-colors hover:border-[#DFBA73] sm:inline-flex">
          SEE THE WORK
        </Link>
      </div>
      <div className="mt-5 flex max-w-2xl flex-wrap gap-2 font-mono text-[9px] tracking-wider text-white/70 sm:text-[10px]">
        <span className="border border-white/15 bg-white/[0.03] px-3 py-1 text-[#F6DC9A]">
          UI/UX DESIGN
        </span>
        <span className="border border-white/15 bg-white/[0.03] px-3 py-1 text-[#FF3333]">
          NO-CODE DEVELOPMENT
        </span>
        <span className="border border-white/15 bg-white/[0.03] px-3 py-1 text-white">
          CREATIVE DIRECTION
        </span>
      </div>
      <p className="mt-4 font-mono text-[9px] font-bold tracking-[0.22em] text-[#DFBA73] uppercase sm:text-[10px]">
        YOUR IDEA. <span className="text-[#FF3333]">YOUR BRAND.</span> YOUR IMPACT.
      </p>
      </div>
      </div>
    </div>
  );
}
