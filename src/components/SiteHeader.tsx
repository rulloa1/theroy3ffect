import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { ArrowUpRight } from "lucide-react";

export type NavTarget =
  "PROJECTS" | "PROCESS" | "ABOUT" | "RESUME" | "PRICING" | "LET'S WORK" | "MENU";

export function SiteHeader({ onNavigate }: { onNavigate?: (target: NavTarget) => void }) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-4 border-b md:gap-8 border-white/5 bg-[#030014]/75 px-3 py-3 backdrop-blur-md transition-all sm:px-6 md:px-10 md:py-4">
      <div className="flex min-w-0 shrink items-center overflow-hidden">
        <Logo variant="responsive" size="sm" href="/" className="inline-flex" />
      </div>

      <nav aria-label="Primary" className="hidden shrink-0 items-center gap-5 lg:flex xl:gap-7">
        <Link to="/work" className="inline-flex min-h-11 items-center font-mono text-xs tracking-widest text-white/90 transition-colors hover:text-[#FF3333]">WORK</Link>
        <Link
          to="/services"
          className="inline-flex min-h-11 items-center font-mono text-xs tracking-widest text-white/90 transition-colors hover:text-[#FF3333]"
        >
          SERVICES
        </Link>
        <Link
          to="/pricing"
          className="inline-flex min-h-11 items-center font-mono text-xs tracking-widest text-white/90 transition-colors hover:text-[#FF3333]"
        >
          PRICING
        </Link>
        <Link
          to="/case-study"
          className="inline-flex min-h-11 items-center font-mono text-xs tracking-widest text-white/90 transition-colors hover:text-[#FF3333]"
        >
          CASE STUDY
        </Link>
      </nav>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Link
          to="/audit"
          className="inline-flex min-h-11 items-center gap-1 rounded-full bg-[#FF3333] px-3 py-2.5 font-mono text-[10px] font-bold tracking-widest text-black transition-all hover:bg-[#FF5555] sm:px-4 sm:text-xs"
        >
          GET YOUR FREE AUDIT
          <ArrowUpRight className="hidden size-3 sm:inline-block" />
        </Link>

        <button
          type="button"
          aria-label="Open menu"
          onClick={() => onNavigate?.("MENU")}
          className="min-h-11 rounded-full border border-white/20 px-3 py-2.5 font-mono text-[10px] tracking-widest text-white transition-colors hover:border-[#FF3333] sm:px-4 sm:text-xs lg:hidden"
        >
          MENU
        </button>

        <Link
          to="/book"
          className="hidden min-h-11 items-center rounded-full border border-white/40 px-3.5 py-2.5 font-mono text-[10px] tracking-widest text-white transition-colors hover:border-[#DFBA73] sm:px-5 sm:text-xs md:inline-flex"
        >
          BOOK A DISCOVERY CALL
        </Link>
      </div>
    </header>
  );
}
