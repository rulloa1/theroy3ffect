import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";
import { ArrowUpRight } from "lucide-react";

export type NavTarget =
  "PROJECTS" | "PROCESS" | "ABOUT" | "RESUME" | "PRICING" | "LET'S WORK" | "MENU";

const LINKS: Exclude<NavTarget, "MENU">[] = ["PROJECTS", "ABOUT", "PROCESS", "PRICING"];

export function SiteHeader({ onNavigate }: { onNavigate: (target: NavTarget) => void }) {
  const { user } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-4 border-b md:gap-8 border-white/5 bg-[#030014]/75 px-3 py-3 backdrop-blur-md transition-all sm:px-6 md:px-10 md:py-4">
      <div className="flex min-w-0 shrink items-center overflow-hidden">
        <Logo variant="responsive" size="sm" href="/" className="inline-flex" />
      </div>

      <nav aria-label="Primary" className="hidden shrink-0 items-center gap-6 lg:flex xl:gap-8">
        <Link
          to="/services"
          className="font-mono text-xs tracking-widest text-white/50 transition-colors hover:text-[#FF3333]"
        >
          SERVICES
        </Link>
        <Link
          to="/pricing"
          className="font-mono text-xs tracking-widest text-white/50 transition-colors hover:text-[#FF3333]"
        >
          PRICING
        </Link>
        <Link
          to="/book"
          className="font-mono text-xs tracking-widest text-white/50 transition-colors hover:text-[#FF3333]"
        >
          BOOK
        </Link>
        <Link
          to="/case-study"
          className="font-mono text-xs tracking-widest text-white/50 transition-colors hover:text-[#FF3333]"
        >
          CASE STUDY
        </Link>
        <Link
          to="/audit"
          className="group inline-flex items-center gap-1 font-mono text-xs tracking-widest text-white/50 transition-colors hover:text-[#FF3333]"
        >
          AUDIT
          <ArrowUpRight className="size-3 opacity-50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
        </Link>
        {LINKS.filter((l) => l !== "PRICING").map((l) => (
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

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Link
          to="/audit"
          className="inline-flex items-center gap-1 rounded-full bg-[#FF3333] px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest text-black transition-all hover:bg-[#FF5555] sm:px-4 sm:py-2 sm:text-xs"
        >
          FREE AUDIT
          <ArrowUpRight className="hidden size-3 sm:inline-block" />
        </Link>

        <button
          type="button"
          aria-label="Open menu"
          onClick={() => onNavigate("MENU")}
          className="rounded-full border border-white/20 px-3 py-1.5 font-mono text-[10px] tracking-widest text-white transition-colors hover:border-[#FF3333] sm:px-4 sm:py-2 sm:text-xs lg:hidden"
        >
          MENU
        </button>

        <Link
          to={user ? "/portal" : "/portal/login"}
          className="hidden rounded-full border border-white/20 px-3 py-1.5 font-mono text-[10px] tracking-widest text-white transition-colors hover:border-[#FF3333] md:inline-block sm:px-4 sm:py-2 sm:text-xs"
        >
          {user ? "MY PORTAL" : "CLIENT SIGN IN"}
        </Link>

        <Link
          to="/book"
          className="hidden rounded-full border border-white/20 px-3.5 py-1.5 font-mono text-[10px] tracking-widest text-white transition-colors hover:border-[#FF3333] hover:bg-[#FF3333] hover:text-black sm:px-5 sm:py-2 sm:text-xs lg:inline-block"
        >
          BOOK A CALL
        </Link>
      </div>
    </header>
  );
}
