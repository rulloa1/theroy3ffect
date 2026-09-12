import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Mail, MapPin, Phone, SearchCheck } from "lucide-react";
import { Logo } from "@/components/Logo";

const STUDIO_LINKS = [
  { label: "WORK", to: "/work" },
  { label: "SERVICES", to: "/services" },
  { label: "PRICING", to: "/pricing" },
  { label: "ABOUT", to: "/about" },
  { label: "PROCESS", to: "/process" },
  { label: "CASE STUDY", to: "/case-study" },
];

const GUIDE_LINKS = [
  { label: "Website audit checklist", to: "/guides/website-audit-checklist" },
  { label: "Houston website cost", to: "/guides/houston-website-cost" },
  { label: "Squarespace vs custom", to: "/guides/squarespace-vs-custom-website" },
];

export function SiteFooter() {
  return (
    <footer className="relative z-20 w-full overflow-hidden border-t border-white/10 bg-[#030014] px-5 pb-8 pt-14 md:px-10 md:pb-10 md:pt-20">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF3333] to-transparent opacity-70" />
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 border-b border-white/10 pb-14 md:grid-cols-2 lg:grid-cols-12 lg:gap-8 lg:pb-16">
          <div className="lg:col-span-5 lg:pr-12">
            <div className="flex items-center gap-4">
              <Logo size="sm" href="/" className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#FF3333] focus-visible:ring-offset-4 focus-visible:ring-offset-[#030014]" />
              <div>
                <p className="font-display text-2xl uppercase text-white">The Roy Effect</p>
                <p className="font-mono text-xs uppercase tracking-widest text-[#DFBA73]">Rory Ulloa · Houston, Texas</p>
              </div>
            </div>
            <p className="mt-6 max-w-lg font-sans text-base leading-[1.6] text-white/90">
              I shape clear brands, useful digital experiences, and no-code websites for owner-run businesses ready to stand out online.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/audit"
                className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#FF3333] px-5 py-3 font-mono text-xs font-bold tracking-widest text-black transition-colors hover:bg-[#FF5555] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <SearchCheck className="size-4" /> GET YOUR FREE AUDIT <ArrowUpRight className="size-4" />
              </Link>
              <Link
                to="/book"
                className="inline-flex min-h-11 items-center justify-center gap-2 border border-white/40 px-5 py-3 font-mono text-xs font-bold tracking-widest text-white transition-colors hover:border-[#DFBA73] hover:text-[#DFBA73] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DFBA73]"
              >
                BOOK A DISCOVERY CALL <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-mono text-xs font-bold tracking-widest text-[#FF3333]">STUDIO</h3>
            <nav className="mt-4 flex flex-col" aria-label="Studio">
              {STUDIO_LINKS.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="inline-flex min-h-11 items-center border-b border-white/5 font-mono text-[15px] text-white/90 transition-colors last:border-0 hover:text-[#FF3333] focus-visible:outline-none focus-visible:text-[#FF3333]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-mono text-xs font-bold tracking-widest text-[#FF3333]">RESOURCES</h3>
            <nav className="mt-4 flex flex-col" aria-label="Resources">
              {GUIDE_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="inline-flex min-h-11 items-center border-b border-white/5 py-2 font-mono text-[15px] leading-snug text-white/90 transition-colors last:border-0 hover:text-[#FF3333] focus-visible:outline-none focus-visible:text-[#FF3333]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="lg:col-span-3">
            <h3 className="font-mono text-xs font-bold tracking-widest text-[#FF3333]">CONTACT</h3>
            <div className="mt-4 font-mono text-[15px] text-white/90">
              <a
                href="mailto:rory@theroyeffect.com"
                className="flex min-h-11 items-center gap-3 border-b border-white/5 transition-colors hover:text-[#FF3333] focus-visible:outline-none focus-visible:text-[#FF3333]"
              >
                <Mail className="size-4 shrink-0 text-[#DFBA73]" /> rory@theroyeffect.com
              </a>
              <a
                href="tel:281-323-0450"
                className="flex min-h-11 items-center gap-3 border-b border-white/5 transition-colors hover:text-[#FF3333] focus-visible:outline-none focus-visible:text-[#FF3333]"
              >
                <Phone className="size-4 shrink-0 text-[#DFBA73]" /> (281) 323-0450
              </a>
              <p className="flex min-h-11 items-center gap-3 text-white/90"><MapPin className="size-4 shrink-0 text-[#DFBA73]" /> Houston, Texas</p>
            </div>
            <Link to="/portal/login" className="mt-5 inline-flex min-h-11 items-center gap-2 font-mono text-xs font-bold tracking-widest text-[#DFBA73] transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white">
              CLIENT SIGN IN <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[15px] text-white/70">© {new Date().getFullYear()} The Roy Effect</p>
          <nav className="flex items-center gap-5" aria-label="Legal">
            <Link to="/privacy" className="inline-flex min-h-11 items-center font-mono text-xs tracking-widest text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white">PRIVACY</Link>
            <Link to="/terms" className="inline-flex min-h-11 items-center font-mono text-xs tracking-widest text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white">TERMS</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
