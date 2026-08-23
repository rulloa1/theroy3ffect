import { Link } from "@tanstack/react-router";
import { ArrowUpRight, SearchCheck } from "lucide-react";

const FOOTER_LINKS = [
  { label: "SERVICES", to: "/services" },
  { label: "PRICING", to: "/pricing" },
  { label: "BOOK", to: "/book" },
  { label: "CASE STUDY", to: "/case-study" },
  { label: "AUDIT", to: "/audit" },
];

const GUIDE_LINKS = [
  { label: "Website audit checklist", to: "/guides/website-audit-checklist" },
  { label: "Houston website cost", to: "/guides/houston-website-cost" },
  { label: "Squarespace vs custom", to: "/guides/squarespace-vs-custom-website" },
];

export function SiteFooter() {
  return (
    <footer className="relative z-20 w-full border-t border-white/10 bg-[#030014] px-5 py-12 md:px-10 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-2 md:items-start lg:grid-cols-12">
          {/* Brand / CTA */}
          <div className="lg:col-span-4">
            <Link
              to="/"
              className="font-display text-2xl uppercase tracking-tight text-white"
            >
              THE ROY EFFECT
            </Link>
            <p className="mt-3 max-w-sm font-mono text-xs leading-relaxed text-white/50">
              Creative direction, UI/UX design and no-code builds for owner-run
              businesses that want to look premium and convert better.
            </p>
            <Link
              to="/audit"
              className="mt-6 inline-flex items-center gap-2 bg-[#FF3333] px-5 py-3 font-mono text-[11px] font-bold tracking-widest text-black transition-all hover:bg-[#FF5555]"
            >
              <SearchCheck className="size-4" />
              FREE 5-MINUTE AUDIT
              <ArrowUpRight className="size-4" />
            </Link>
          </div>

          {/* Quick links */}
          <div className="lg:col-span-2">
            <h3 className="font-mono text-[11px] tracking-widest text-white/40">
              NAVIGATION
            </h3>
            <nav className="mt-4 flex flex-wrap gap-x-6 gap-y-3" aria-label="Footer">
              {FOOTER_LINKS.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="font-mono text-xs tracking-widest text-white/60 transition-colors hover:text-[#FF3333]"
                >
                  {link.label}
                </Link>
              ))}
              <a
                href="mailto:rory@theroyeffect.com"
                className="font-mono text-xs tracking-widest text-white/60 transition-colors hover:text-[#FF3333]"
              >
                CONTACT
              </a>
            </nav>
          </div>


          {/* Contact */}
          <div className="lg:col-span-3">
            <h3 className="font-mono text-[11px] tracking-widest text-white/40">
              CONTACT
            </h3>
            <div className="mt-4 space-y-2 font-mono text-xs text-white/60">
              <a
                href="mailto:rory@theroyeffect.com"
                className="block transition-colors hover:text-[#FF3333]"
              >
                rory@theroyeffect.com
              </a>
              <a
                href="tel:281-323-0450"
                className="block transition-colors hover:text-[#FF3333]"
              >
                (281) 323-0450
              </a>
              <p className="text-white/40">Houston, Texas</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 md:flex-row">
          <p className="font-mono text-[10px] text-white/40">
            © {new Date().getFullYear()} THE ROY EFFECT. DIRT, REFINED INTO GOLD.
          </p>
          <p className="font-mono text-[10px] text-white/40">
            <Link to="/" className="transition-colors hover:text-[#FF3333]">
              HOME
            </Link>
            {" — "}
            <Link to="/audit" className="transition-colors hover:text-[#FF3333]">
              FREE AUDIT
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
