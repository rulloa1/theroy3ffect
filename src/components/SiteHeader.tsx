import { Link } from "@tanstack/react-router";

export type NavTarget = "PROJECTS" | "BLOG" | "ABOUT" | "RESUME" | "LET'S WORK" | "MENU";

const LINKS: Exclude<NavTarget, "MENU">[] = ["PROJECTS", "ABOUT", "BLOG"];

export function SiteHeader({ onNavigate }: { onNavigate: (target: NavTarget) => void }) {
  return (
    <header className="relative z-30 flex items-center justify-between px-5 py-5 md:px-10">
      <Link to="/" className="group flex items-center gap-3" aria-label="theroyeffect home">
        <span className="font-display text-xl uppercase tracking-widest md:text-2xl">ROY</span>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF3333] text-black transition-transform duration-500 group-hover:rotate-180">
          ✦
        </span>
      </Link>

      <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
        {LINKS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => onNavigate(l)}
            className="font-mono text-xs tracking-widest text-white/50 transition-colors hover:text-[#FF3333]"
          >
            {l}
          </button>
        ))}
      </nav>

      <button
        type="button"
        aria-label="Open menu"
        onClick={() => onNavigate("MENU")}
        className="rounded-full border border-white/20 px-4 py-2 font-mono text-xs tracking-widest text-white transition-colors hover:border-[#FF3333] md:hidden"
      >
        MENU
      </button>

      <button
        type="button"
        onClick={() => onNavigate("LET'S WORK")}
        className="rounded-full border border-white/20 px-5 py-2 font-mono text-xs tracking-widest text-white transition-colors hover:border-[#FF3333] hover:bg-[#FF3333] hover:text-black"
      >
        COMMISSION
      </button>
    </header>
  );
}
