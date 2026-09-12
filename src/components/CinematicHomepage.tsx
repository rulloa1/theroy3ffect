import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Check, Mail, Phone, SearchCheck, Smartphone, Timer, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader, type NavTarget } from "@/components/SiteHeader";
import { InfoDrawer } from "@/components/InfoDrawer";
import { SmsConsent } from "@/components/SmsConsent";
import { CinematicEffects } from "@/components/CinematicEffects";
import { CinematicReveal } from "@/components/CinematicReveal";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { SHOWCASE_WORK, PROCESS_STEPS } from "@/lib/site-content";
import { PRICING_TIERS, ADD_ONS } from "@/lib/commerce-catalog";
import { LINKEDIN_URL, RESUME_URL, X_URL } from "@/lib/site";
import portraitAsset from "@/assets/rory-portrait-clean.webp.asset.json";

const PROMISE_STEPS = [
  { step: "01", title: "Design first", body: "You see the full design before a single page is built." },
  { step: "02", title: "Sign-off in writing", body: "Nothing moves to build until you've approved it." },
  { step: "03", title: "What you approved is what ships", body: "No surprises at launch. Change requests are yours to make, not mine." },
];

function TechLink({ to, label, corner, ghost = false }: { to: string; label: string; corner: string; ghost?: boolean }) {
  return (
    <Link to={to} className={`tech-button ${ghost ? "ghost" : ""}`}>
      <span className="tech-button-inner"><Mail aria-hidden="true" />{label}</span>
      <span className="tech-tick a" aria-hidden="true" /><span className="tech-tick b" aria-hidden="true" />
      <span className="tech-corner" aria-hidden="true">{corner}</span>
    </Link>
  );
}

function WorkBadge() {
  return (
    <a className="work-badge" href="#work" aria-label="Discover my work">
      <svg viewBox="0 0 120 120" aria-hidden="true"><defs><path id="work-ring" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" /></defs><text><textPath href="#work-ring">Discover my work · Explore the portfolio · </textPath></text></svg>
      <span>→</span>
    </a>
  );
}

function ContactForm() {
  const [smsService, setSmsService] = useState(false);
  const [smsMarketing, setSmsMarketing] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [note, setNote] = useState("I reply within one business day.");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    if (!name || !email || message.length < 10) {
      setStatus("error"); setNote("Add your name, a working email, and at least 10 characters about the project."); return;
    }
    setStatus("sending"); setNote("Sending your project details…");
    try {
      const response = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, phone: String(data.get("phone") ?? ""), websiteUrl: String(data.get("websiteUrl") ?? ""),
          projectType: String(data.get("projectType") ?? ""), message, smsService, smsMarketing, source: "website_home_form",
        }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not send your inquiry right now.");
      form.reset(); setSmsService(false); setSmsMarketing(false); setStatus("success");
      setNote("Sent — expect a reply within one business day.");
    } catch (error) {
      setStatus("error"); setNote(error instanceof Error ? error.message : "Could not send your inquiry right now.");
    }
  };

  return (
    <form className="cinematic-form" onSubmit={submit} noValidate>
      <div className="cinematic-field"><label htmlFor="home-name">Name</label><input id="home-name" name="name" autoComplete="name" required /></div>
      <div className="cinematic-field"><label htmlFor="home-email">Email</label><input id="home-email" name="email" type="email" autoComplete="email" required /></div>
      <div className="cinematic-field"><label htmlFor="home-phone">Phone</label><input id="home-phone" name="phone" type="tel" autoComplete="tel" /></div>
      <div className="cinematic-field"><label htmlFor="home-site">Current website</label><input id="home-site" name="websiteUrl" type="url" placeholder="https://" /></div>
      <div className="cinematic-field full"><label htmlFor="home-type">What do you need</label><select id="home-type" name="projectType" defaultValue="Website / UI-UX"><option>Brand Sprint</option><option>Website / UI-UX</option><option>Design + Build</option><option>Retainer</option><option>Not sure yet</option></select></div>
      <div className="cinematic-field full"><label htmlFor="home-message">About the business</label><textarea id="home-message" name="message" minLength={10} placeholder="What you do, who you want to reach, and what's in the way." required /></div>
      <SmsConsent smsService={smsService} smsMarketing={smsMarketing} onChange={(field, value) => field === "smsService" ? setSmsService(value) : setSmsMarketing(value)} className="full" />
      <div className="cinematic-submit full">
        <Button type="submit" disabled={status === "sending"} className="cinematic-pill solid min-h-11 px-6">{status === "sending" ? "SENDING…" : "SEND IT"}</Button>
        <p aria-live="polite" className={status === "error" ? "text-destructive" : status === "success" ? "text-primary" : ""}>{note}</p>
      </div>
    </form>
  );
}

export function CinematicHomepage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSection, setDrawerSection] = useState<Exclude<NavTarget, "MENU"> | null>(null);
  const openDrawer = (target: NavTarget) => { setDrawerSection(target === "MENU" ? null : target); setDrawerOpen(true); };
  const socialLinks = [{ label: "LinkedIn", href: LINKEDIN_URL }, { label: "X", href: X_URL }].filter((item): item is { label: string; href: string } => Boolean(item.href));

  return (
    <main id="top" className="cinematic-home">
      <CinematicEffects />
      <SiteHeader onNavigate={openDrawer} />

      <section className="cinematic-hero">
        <div className="cinematic-portrait"><img src={portraitAsset.url} alt="Rory Ulloa, creative director, UI/UX designer and no-code developer" width={896} height={1078} loading="eager" decoding="async" fetchPriority="high" /></div>
        <nav className="social-rail" aria-label="Social links">
          {socialLinks.map((link) => <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.label}>{link.label === "LinkedIn" ? "in" : "𝕏"}</a>)}
          <a href="mailto:rory@theroyeffect.com" aria-label="Email"><Mail /></a>
        </nav>
        <div className="cinematic-hero-copy">
          <div className="cinematic-eyebrow"><span aria-hidden="true" /><p className="cinematic-label">Available for new projects · Spring / Houston, Texas</p></div>
          <h1><span className="line"><span>Rory Roy</span></span><span className="line"><em>Ulloa</em></span></h1>
          <p className="cinematic-tagline"><span>Turning ideas into</span><b>digital experiences<i aria-hidden="true" /></b></p>
          <p className="cinematic-lede">Designer and no-code builder behind The Roy Effect. I take businesses whose work is better than their website and give them a brand, a site, and a build they own outright — one person, start to launch.</p>
          <div className="cinematic-hero-actions"><TechLink to="/book" label="Hire me" corner="Call" />{RESUME_URL ? <TechLink to={RESUME_URL} label="Resume" corner="PDF" ghost /> : null}<WorkBadge /></div>
        </div>
        <aside className="cinematic-facts"><div><span className="cinematic-label">Based in</span><strong>Houston, Texas</strong></div><div><span className="cinematic-label">Specializing in</span><strong>Creative development</strong></div><div><span className="cinematic-label">Featured work</span><Link to="/work">Responsive service site</Link></div></aside>
        <div className="scroll-cue" aria-hidden="true"><span className="cinematic-label">Scroll</span><i /></div>
      </section>

      <div className="cinematic-marquee" aria-hidden="true"><div>{[0,1].map((copy) => <span key={copy}>Brand identity <i>✦</i> Web &amp; UI/UX design <i>✦</i> No-code build <i>✦</i> Stand out online <i>✦</i></span>)}</div></div>

      <section id="work" className="cinematic-section cinematic-wrap">
        <CinematicReveal><div className="cinematic-section-head"><span className="cinematic-label">Selected work</span><h2>Three pieces of studio work, and the way I&apos;d treat yours.</h2></div></CinematicReveal>
        <CinematicReveal className="work-ledger">{SHOWCASE_WORK.map((work) => <Link to="/work" key={work.slug} className="work-ledger-row"><div className="work-thumb"><img src={work.image ?? ""} alt={work.alt} loading="lazy" decoding="async" /></div><h3>{work.title}</h3><p>{work.eyebrow}<br />{work.result}</p><span className="work-arrow">→</span></Link>)}</CinematicReveal>
        <p className="honesty-line">Named client work is added with written permission — I&apos;ll walk you through live projects on the call.</p>
        <Link to="/process" className="cinematic-text-link">See how I work <ArrowUpRight /></Link>
      </section>

      <section id="effect" className="cinematic-section cinematic-wrap soot-section">
        <CinematicReveal><div className="cinematic-section-head"><span className="cinematic-label">The effect</span><h2>Same business. Same people. Same phone number. Different first impression.</h2></div></CinematicReveal>
        <CinematicReveal className="effect-grid"><BeforeAfterSlider /><div className="effect-copy"><h3>The Roy Effect is the gap between what a business is and what its website says it is.</h3><p>Many established firms have years of good work, a full calendar from referrals, and a website that no longer reflects them. The work isn&apos;t the problem. The first impression is — and it&apos;s the only part a new customer sees.</p><p>I close that gap: an identity that matches the quality of the work, a site that says the important things in the first five seconds, and a build you can run yourself afterward. The example here is illustrative; the studio work lives above.</p></div></CinematicReveal>
      </section>

      <section className="cinematic-section cinematic-wrap">
        <CinematicReveal><span className="cinematic-label">The approval promise</span><h2 className="promise-heading">You approve the design. That design is what goes live.</h2><p className="promise-lede">No bait-and-switch between the mockup and the build. You sign off on the design before any build work starts, and the site that launches is the one you approved. If something changes, it&apos;s because you asked for it.</p><div className="promise-grid">{PROMISE_STEPS.map((item) => <article key={item.step}><span>{item.step}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}</div></CinematicReveal>
      </section>

      <section className="cinematic-section cinematic-wrap soot-section"><CinematicReveal><div className="cinematic-section-head"><span className="cinematic-label">Fit</span><h2>Who it&apos;s for</h2></div><div className="fit-grid"><div className="take"><h3>I take</h3><p>Houston and remote founders, personal brands, and service businesses that already have demand and a weak site.</p></div><div><h3>I pass</h3><p>Logo-only jobs with no strategy, 40-page brochure rebuilds on a $1,500 budget, and “make it pop” with no offer.</p></div></div></CinematicReveal></section>

      <section id="packages" className="cinematic-section cinematic-wrap">
        <CinematicReveal><div className="cinematic-section-head"><span className="cinematic-label">Packages</span><h2>Fixed scope, clear starting price, no hourly meter running.</h2></div></CinematicReveal>
        <CinematicReveal className="package-ledger">{PRICING_TIERS.map((tier) => <article key={tier.name} className={`package-row ${tier.featured ? "featured" : ""}`}><div><h3>{tier.name}{tier.featured ? <small>most chosen</small> : null}</h3><p>{tier.description}</p></div><ul>{tier.features.map((feature) => <li key={feature}>{feature}</li>)}</ul><div className="package-price"><span>{tier.note === "/mo" ? "Monthly" : "From"}</span><b>{tier.price}</b>{tier.note === "/mo" ? <em>/mo</em> : null}</div><Link to="/pricing" className={`cinematic-pill ${tier.featured ? "solid" : ""}`}>{tier.cta}</Link></article>)}</CinematicReveal>
        <div className="addons-line"><span className="cinematic-label">Add-ons</span>{ADD_ONS.map((item) => <span key={item.name}>{item.name} {item.amountLabel}</span>)}</div>
        <p className="pricing-fineprint">All projects begin with a free 15-minute discovery call. Deposits are 50% of the tier&apos;s starting price: Brand Sprint $1,250, Website / UI-UX $2,500, and Design + Build $4,000. Each deposit is credited against your final invoice and fully refundable before kickoff. Retainers bill monthly and can be paused or cancelled anytime. No account needed — you’ll get a receipt and a brief link by email right after checkout.</p>
        <Link to="/pricing" className="cinematic-text-link">See full pricing and checkout →</Link>
      </section>

      <section id="process" className="cinematic-section cinematic-wrap soot-section"><CinematicReveal><div className="cinematic-section-head"><span className="cinematic-label">How it goes</span><h2>From brief to launch, one clear sequence.</h2></div></CinematicReveal><div className="process-grid">{PROCESS_STEPS.map((step) => <CinematicReveal key={step.step} className="process-step"><span>{step.step}</span><h3>{step.title}</h3><p>{step.body}</p></CinematicReveal>)}</div><Link to="/process" className="cinematic-text-link">Read the full process →</Link></section>

      <section className="cinematic-section cinematic-wrap"><CinematicReveal className="audit-panel"><div><span className="cinematic-label ember-label">Free video website audit</span><h2>One minute to request. Five minutes of focused feedback.</h2><p>Submit your URL in about one minute. I&apos;ll email a personalised video teardown around five minutes long, covering your homepage, mobile UX and conversion flow.</p><Link to="/audit" className="cinematic-pill solid">Get your free audit <ArrowUpRight /></Link></div><div className="audit-tiles">{[[SearchCheck,"Conversion audit","Find the leaks in your funnel and fix your messaging."],[Smartphone,"Mobile UX review","See where friction kills enquiries on phones."],[Zap,"Quick wins","Actionable fixes you can implement this week."],[Timer,"About 5 minutes","Your personalised video teardown arrives by email."]].map(([Icon,title,copy]) => { const TileIcon = Icon as typeof SearchCheck; return <article key={String(title)}><TileIcon /><h3>{String(title)}</h3><p>{String(copy)}</p></article>; })}</div></CinematicReveal></section>

      <section className="cinematic-section cinematic-wrap soot-section"><CinematicReveal className="call-panel"><div><span className="cinematic-label">Free 15-minute discovery call</span><h2>Book a discovery call</h2><p>Bring the goal, timeline, and budget. This free 15-minute call ends with a clear written recommendation.</p><Link to="/book" className="cinematic-pill">Book a discovery call <ArrowUpRight /></Link></div><ul>{["Free 15-minute call, no pitch","Scope, timeline, budget","Leave with a written recommendation"].map((item) => <li key={item}><Check />{item}</li>)}</ul></CinematicReveal></section>

      <section className="cinematic-section cinematic-wrap"><CinematicReveal><h2 className="seo-heading">Web design in Houston</h2><p className="seo-copy">I&apos;m based near Houston and work remotely with founders and service businesses. Most projects start with the free audit; starting investment is $2,500 for brand, $5,000 for UI/UX, and $8,000 for design + build.</p><div className="seo-links"><Link to="/guides/houston-website-cost">Houston website cost →</Link><Link to="/guides/squarespace-vs-custom-website">Squarespace vs custom →</Link></div></CinematicReveal></section>

      <section id="contact" className="cinematic-section cinematic-wrap contact-section"><div className="contact-grid"><CinematicReveal className="contact-copy"><span className="cinematic-label">Let&apos;s work</span><h2>Tell us about the business. We&apos;ll show you the site.</h2><p>Send a few lines and I&apos;ll come back within one business day — or book a free discovery call directly.</p><div className="direct-links"><Link to="/book"><span>Book a discovery call</span><small>15 min · free</small></Link><a href="mailto:rory@theroyeffect.com"><span>Email</span><small>rory@theroyeffect.com</small></a><a href="tel:+12813230450"><span>Call or text</span><small>(281) 323-0450</small></a></div></CinematicReveal><CinematicReveal><ContactForm /></CinematicReveal></div></section>

      <InfoDrawer open={drawerOpen} section={drawerSection} onClose={() => { setDrawerOpen(false); setDrawerSection(null); }} />
    </main>
  );
}