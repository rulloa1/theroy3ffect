import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

export type NavTarget =
  "PROJECTS" | "PROCESS" | "ABOUT" | "RESUME" | "PRICING" | "LET'S WORK" | "MENU";

export function SiteHeader({ onNavigate }: { onNavigate?: (target: NavTarget) => void }) {
  return (
    <header className="cinematic-nav">
      <Link to="/" className="cinematic-brand" aria-label="The Roy Effect home">
        <span className="cinematic-brand-mark">R</span><span>the<b>ROY</b>effect</span>
      </Link>

      <nav aria-label="Primary" className="cinematic-nav-links hidden shrink-0 items-center gap-5 lg:flex xl:gap-7">
        <Link to="/work">WORK</Link>
        <Link
          to="/services"
          className=""
        >
          SERVICES
        </Link>
        <Link
          to="/pricing"
          className=""
        >
          PRICING
        </Link>
        <Link
          to="/case-study"
          className=""
        >
          CASE STUDY
        </Link>
      </nav>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Link
          to="/audit"
          className="cinematic-pill solid px-3 sm:px-4"
        >
          GET YOUR FREE AUDIT
          <ArrowUpRight className="hidden size-3 sm:inline-block" />
        </Link>

        <button
          type="button"
          aria-label="Open menu"
          onClick={() => onNavigate?.("MENU")}
          className="cinematic-pill px-3 sm:px-4 lg:hidden"
        >
          MENU
        </button>

        <Link
          to="/book"
          className="cinematic-pill hidden px-3.5 sm:px-5 md:inline-flex"
        >
          BOOK A DISCOVERY CALL
        </Link>
      </div>
    </header>
  );
}
