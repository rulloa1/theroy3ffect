import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";

export type NavTarget =
  "PROJECTS" | "PROCESS" | "ABOUT" | "RESUME" | "PRICING" | "LET'S WORK" | "MENU";

const LINKS: Exclude<NavTarget, "MENU">[] = ["PROJECTS", "ABOUT", "PROCESS", "PRICING"];

export function SiteHeader({ onNavigate }: { onNavigate: (target: NavTarget) => void }) {
  const { user } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-2 border-b border-white/5 bg-[#030014]/75 px-3 py-3 backdrop-blur-md transition-all sm:px-6 md:px-10 md:py-4">
      <div className="flex min-w-0 items-center overflow-hidden">
        <Logo variant="responsive" size="sm" href="/" className="inline-flex" />
      </div>

      <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
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

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Link
          to="/audit"
          className="hidden rounded-full border border-[#DFBA73]/40 bg-[#DFBA73]/10 px-3.5 py-1.5 font-mono text-[10px] font-bold tracking-widest text-[#F6DC9A] transition-all hover:bg-[#DFBA73] hover:text-black sm:inline-block sm:px-4 sm:py-2 sm:text-xs"
        >
          FREE AUDIT
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
          to={user ? "/account" : "/auth"}
          className="hidden rounded-full border border-white/20 px-3 py-1.5 font-mono text-[10px] tracking-widest text-white transition-colors hover:border-[#FF3333] md:inline-block sm:px-4 sm:py-2 sm:text-xs"
        >
          {user ? "ACCOUNT" : "SIGN IN"}
        </Link>

        <button
          type="button"
          onClick={() => onNavigate("LET'S WORK")}
          className="rounded-full border border-white/20 px-3.5 py-1.5 font-mono text-[10px] tracking-widest text-white transition-colors hover:border-[#FF3333] hover:bg-[#FF3333] hover:text-black sm:px-5 sm:py-2 sm:text-xs"
        >
          COMMISSION
        </button>
      </div>
    </header>
  );
}
