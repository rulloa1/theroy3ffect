import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";

export type NavTarget = "PROJECTS" | "PROCESS" | "ABOUT" | "RESUME" | "PRICING" | "LET'S WORK" | "MENU";

const LINKS: Exclude<NavTarget, "MENU">[] = ["PROJECTS", "ABOUT", "PROCESS", "PRICING"];

export function SiteHeader({ onNavigate }: { onNavigate: (target: NavTarget) => void }) {
  const { user } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-5 md:px-10">
      <div className="flex items-center">
        <Logo variant="full" size="md" href="/" className="hidden sm:inline-flex" />
        <Logo variant="compact" size="md" href="/" className="inline-flex sm:hidden" />
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

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => onNavigate("MENU")}
          className="rounded-full border border-white/20 px-4 py-2 font-mono text-xs tracking-widest text-white transition-colors hover:border-[#FF3333] lg:hidden"
        >
          MENU
        </button>

        <Link
          to={user ? "/account" : "/auth"}
          className="hidden rounded-full border border-white/20 px-4 py-2 font-mono text-xs tracking-widest text-white transition-colors hover:border-[#FF3333] sm:inline-block"
        >
          {user ? "ACCOUNT" : "SIGN IN"}
        </Link>

        <button
          type="button"
          onClick={() => onNavigate("LET'S WORK")}


          className="rounded-full border border-white/20 px-5 py-2 font-mono text-xs tracking-widest text-white transition-colors hover:border-[#FF3333] hover:bg-[#FF3333] hover:text-black"
        >
          COMMISSION
        </button>
      </div>
    </header>
  );
}

