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
    <footer className="relative z-20 w-full overflow-hidden border-t border-border bg-background px-5 pb-8 pt-14 md:px-10 md:pb-10 md:pt-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 border-b border-border pb-14 md:grid-cols-2 lg:grid-cols-12 lg:gap-8 lg:pb-16">
          <div className="lg:col-span-5 lg:pr-12">
            <div className="flex items-center gap-4">
              <Logo size="sm" href="/" className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background" />
              <div>
                <p className="font-display text-2xl text-foreground">The Roy Effect</p>
                <p className="font-mono text-xs uppercase tracking-widest text-primary">Rory Ulloa · Houston, Texas</p>
              </div>
            </div>
            <p className="mt-6 max-w-lg font-sans text-base leading-[1.6] text-foreground/90">
              I shape clear brands, useful digital experiences, and no-code websites for owner-run businesses ready to stand out online.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/audit"
                className="cinematic-pill solid px-5"
              >
                <SearchCheck className="size-4" /> GET YOUR FREE AUDIT <ArrowUpRight className="size-4" />
              </Link>
              <Link
                to="/book"
                className="cinematic-pill px-5"
              >
                BOOK A DISCOVERY CALL <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-mono text-xs font-bold tracking-widest text-primary">STUDIO</h3>
            <nav className="mt-4 flex flex-col" aria-label="Studio">
              {STUDIO_LINKS.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="inline-flex min-h-11 items-center border-b border-border font-mono text-[15px] text-foreground/90 transition-colors last:border-0 hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-mono text-xs font-bold tracking-widest text-primary">RESOURCES</h3>
            <nav className="mt-4 flex flex-col" aria-label="Resources">
              {GUIDE_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="inline-flex min-h-11 items-center border-b border-border py-2 font-mono text-[15px] leading-snug text-foreground/90 transition-colors last:border-0 hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="lg:col-span-3">
            <h3 className="font-mono text-xs font-bold tracking-widest text-primary">CONTACT</h3>
            <div className="mt-4 font-mono text-[15px] text-foreground/90">
              <a
                href="mailto:rory@theroyeffect.com"
                className="flex min-h-11 items-center gap-3 border-b border-border transition-colors hover:text-primary"
              >
                <Mail className="size-4 shrink-0 text-primary" /> rory@theroyeffect.com
              </a>
              <a
                href="tel:281-323-0450"
                className="flex min-h-11 items-center gap-3 border-b border-border transition-colors hover:text-primary"
              >
                <Phone className="size-4 shrink-0 text-primary" /> (281) 323-0450
              </a>
              <p className="flex min-h-11 items-center gap-3 text-foreground/90"><MapPin className="size-4 shrink-0 text-primary" /> Houston, Texas</p>
            </div>
            <Link to="/portal/login" className="mt-5 inline-flex min-h-11 items-center gap-2 font-mono text-xs font-bold tracking-widest text-primary transition-colors hover:text-foreground">
              CLIENT SIGN IN <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[15px] text-muted-foreground">© {new Date().getFullYear()} The Roy Effect</p>
          <nav className="flex items-center gap-5" aria-label="Legal">
            <Link to="/privacy" className="inline-flex min-h-11 items-center font-mono text-xs tracking-widest text-muted-foreground transition-colors hover:text-primary">PRIVACY</Link>
            <Link to="/terms" className="inline-flex min-h-11 items-center font-mono text-xs tracking-widest text-muted-foreground transition-colors hover:text-primary">TERMS</Link>
            <span className="font-mono text-xs uppercase tracking-widest text-primary">Stand out online</span>
          </nav>
        </div>
      </div>
    </footer>
  );
}
