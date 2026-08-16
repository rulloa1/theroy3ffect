import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, Check, Menu, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { PRICING_TIERS } from "./Pricing";

const MENU = ["PROJECTS", "PROCESS", "ABOUT", "RESUME", "PRICING", "LET'S WORK"] as const;
type MenuItem = (typeof MENU)[number];

interface Project {
  title: string;
  tagline: string;
  description: string;
  url: string;
  tags: string[];
}

const PROJECTS: Project[] = [
  {
    title: "Zest Depot",
    tagline: "Brand & digital experience",
    description:
      "A modern, high-energy storefront and brand system built for a fast-moving retail concept. Focus on conversion, clarity, and bold visual identity.",
    url: "https://zest-depot-dev.lovable.app",
    tags: ["UI/UX", "Brand Identity", "No-Code Build"],
  },
];


const fieldClass =
  "w-full border-0 border-b border-white/30 bg-transparent px-0 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#FF3333] focus:outline-none focus:ring-0";

const briefSchema = z.object({
  name: z.string().trim().min(1, "Please add your name").max(100, "Name is too long"),
  email: z.string().trim().email("Enter a valid email").max(255),
  projectType: z.string().trim().max(60),
  message: z
    .string()
    .trim()
    .min(10, "Tell me a bit more about the project")
    .max(2000, "Please keep it under 2000 characters"),
});

export function InfoDrawer({
  open,
  onClose,
  section = null,
}: {
  open: boolean;
  onClose: () => void;
  section?: MenuItem | null;
}) {
  const [active, setActive] = useState<MenuItem | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) setActive(section);
  }, [open, section]);

  const close = () => {
    setActive(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const parsed = briefSchema.safeParse({
      name: String(data["name"] ?? ""),
      email: String(data["email"] ?? ""),
      projectType: String(data["projectType"] ?? ""),
      message: String(data["message"] ?? ""),
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(body.error ?? "Could not send your brief. Please try again.");
        return;
      }
      toast.success("Brief received — I'll be in touch shortly.");
      form.reset();
      close();
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          />
          <motion.aside
            role="dialog"
            aria-label="Site menu"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
            className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto border-l border-white/5 bg-[#333333] sm:max-w-xl md:max-w-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between bg-[#333333]/90 px-6 py-5 backdrop-blur">
              <button
                type="button"
                aria-label={active ? "Back to menu" : "Menu"}
                onClick={() => setActive(null)}
                className="flex items-center gap-2 font-mono text-xs tracking-widest text-white/60 hover:text-[#FF3333]"
              >
                {active ? <ArrowLeft className="size-4" /> : <Menu className="size-4" />}
                {active ? "BACK" : "MENU"}
              </button>
              <button
                type="button"
                aria-label="Close menu"
                onClick={close}
                className="flex size-10 items-center justify-center rounded-full border border-white/15 text-white hover:bg-[#FF3333] hover:text-black"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="px-6 pb-16 pt-6">
              {!active && (
                <ul className="space-y-2">
                  {MENU.map((item) => (
                    <li key={item}>
                      <button
                        type="button"
                        onClick={() => setActive(item)}
                        className="group flex w-full items-center justify-between border-b border-white/10 py-5 text-left"
                      >
                        <span className="font-display text-3xl uppercase tracking-wide text-white transition-colors group-hover:text-[#FF3333] md:text-5xl">
                          {item}
                        </span>
                        <span className="font-mono text-xs text-white/40">↗</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {active === "PRICING" && (
                <div className="space-y-6">
                  <div>
                    <span className="font-mono text-xs tracking-widest text-[#FF3333]">PRICING</span>
                    <h2 className="mt-2 font-display text-4xl uppercase text-white">Investment</h2>
                  </div>
                  <div className="space-y-4">
                    {PRICING_TIERS.map((tier) => (
                      <div
                        key={tier.name}
                        className={`border p-4 transition-colors hover:border-[#FF3333]/50 ${
                          tier.featured ? "border-[#FF3333] bg-[#FF3333]/5" : "border-white/10 bg-white/[0.02]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-display text-lg uppercase tracking-wide text-white">
                              {tier.name}
                            </h3>
                            <p className="mt-1 max-w-sm font-mono text-xs leading-relaxed text-white/50">
                              {tier.description}
                            </p>
                          </div>
                          <div className="text-right">
                            {tier.featured && (
                              <span className="mb-1 flex items-center justify-end gap-1 font-mono text-[10px] text-[#FF3333]">
                                <Sparkles className="size-3" /> POPULAR
                              </span>
                            )}
                            <span className="font-mono text-xs text-white/40">{tier.note}</span>
                            <span className="block font-display text-3xl text-[#FF3333]">{tier.price}</span>
                          </div>
                        </div>
                        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                          {tier.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-2 font-mono text-xs text-white/70">
                              <Check className="mt-0.5 size-3 shrink-0 text-[#FF3333]" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <p className="font-mono text-[11px] leading-relaxed text-white/40">
                    All projects start with a free 15-minute discovery call. Scope and final quotes are always tailored to your specific needs.
                  </p>
                </div>
              )}

              {active === "LET'S WORK" && (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <h2 className="font-display text-4xl uppercase text-[#FF3333]">Let&apos;s work</h2>
                  <input
                    aria-label="Your name"
                    name="name"
                    className={fieldClass}
                    placeholder="Name"
                    maxLength={100}
                    required
                  />
                  <input
                    aria-label="Your email"
                    name="email"
                    type="email"
                    className={fieldClass}
                    placeholder="Email"
                    maxLength={255}
                    required
                  />
                  <select aria-label="Project type" name="projectType" className={fieldClass} defaultValue="">
                    <option value="" disabled className="bg-[#333333]">
                      Project type
                    </option>
                    <option className="bg-[#333333]">Brand identity</option>
                    <option className="bg-[#333333]">Website / UI-UX</option>
                    <option className="bg-[#333333]">No-code build</option>
                    <option className="bg-[#333333]">Other</option>
                  </select>
                  <textarea
                    aria-label="Project details"
                    name="message"
                    rows={4}
                    className={fieldClass}
                    placeholder="Tell me about the project"
                    minLength={10}
                    maxLength={2000}
                    required
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-[#FF3333] px-6 py-4 font-mono text-xs tracking-widest text-black transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {sending ? "SENDING..." : "SEND BRIEF"}
                  </button>
                </form>
              )}

              {active === "PROJECTS" && (
                <div className="space-y-6">
                  <div>
                    <span className="font-mono text-xs tracking-widest text-[#FF3333]">SELECTED WORK</span>
                    <h2 className="mt-2 font-display text-4xl uppercase text-white">Projects</h2>
                  </div>
                  <div className="grid gap-4">
                    {PROJECTS.map((project) => (
                      <a
                        key={project.title}
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-[#FF3333]/50"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-display text-xl uppercase tracking-wide text-white transition-colors group-hover:text-[#FF3333]">
                              {project.title}
                            </h3>
                            <p className="mt-1 font-mono text-xs text-white/40">{project.tagline}</p>
                          </div>
                          <ArrowUpRight className="size-5 shrink-0 text-white/40 transition-colors group-hover:text-[#FF3333]" />
                        </div>
                        <p className="mt-3 max-w-md font-mono text-xs leading-relaxed text-white/50">
                          {project.description}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {project.tags.map((tag) => (
                            <span
                              key={tag}
                              className="border border-white/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-white/60"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </a>
                    ))}
                  </div>
                  <p className="font-mono text-[11px] leading-relaxed text-white/40">
                    More case studies and process decks are available on request. Reach out through
                    Let&apos;s Work to discuss a similar project.
                  </p>
                </div>
              )}

              {active === "ABOUT" && (
                <div className="space-y-6">
                  <div>
                    <span className="font-mono text-xs tracking-widest text-[#FF3333]">ABOUT</span>
                    <h2 className="mt-2 font-display text-4xl uppercase text-white">Rory Ulloa</h2>
                  </div>
                  <div className="max-w-lg space-y-4 font-mono text-xs leading-relaxed text-white/60">
                    <p>
                      I&apos;m a freelance UI/UX designer and no-code developer working with founders and
                      small teams across the US, based in the Houston, Texas area and available remotely.
                    </p>
                    <p>
                      My work sits between brand and build: identity systems, high-contrast interface
                      design, and shipped, production-ready websites and web apps. I design in Figma and
                      build with modern no-code and AI-assisted stacks, so the thing you approve is the
                      thing that goes live — no handoff gap, no rebuild.
                    </p>
                    <p>
                      Typical engagements run from a one-week brand sprint to a full design-and-build
                      project, with an ongoing retainer for teams that ship continuously. Every project
                      starts with a written brief and a fixed scope so you know the cost before we begin.
                    </p>
                  </div>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {[
                      "Brand identity & visual systems",
                      "UI/UX design for web & product",
                      "No-code / AI-assisted development",
                      "Landing pages & conversion design",
                      "Design systems & component libraries",
                      "Ongoing design retainers",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 font-mono text-xs text-white/70">
                        <Check className="mt-0.5 size-3 shrink-0 text-[#FF3333]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="font-mono text-[11px] text-white/40">
                    rory@theroyeffect.com · (281) 323-0450
                  </p>
                </div>
              )}

              {active === "PROCESS" && (
                <div className="space-y-6">
                  <div>
                    <span className="font-mono text-xs tracking-widest text-[#FF3333]">HOW I WORK</span>
                    <h2 className="mt-2 font-display text-4xl uppercase text-white">Process</h2>
                  </div>
                  <ol className="space-y-5">
                    {[
                      {
                        step: "01",
                        title: "Brief & scope",
                        body: "You send a short brief — goals, audience, timeline, budget. I come back with a fixed scope, a price, and a start date. Nothing begins until both are agreed in writing.",
                      },
                      {
                        step: "02",
                        title: "Direction",
                        body: "One focused round of visual direction: type, colour, layout language and the tone of the interface. We lock a single direction before any production work starts.",
                      },
                      {
                        step: "03",
                        title: "Design",
                        body: "Full screens designed responsively, mobile through desktop, with real content instead of placeholder text. Two revision rounds are included in every project tier.",
                      },
                      {
                        step: "04",
                        title: "Build & launch",
                        body: "I build the approved design as a live, responsive site — forms, payments, analytics and SEO basics wired up — then hand over access and a short walkthrough.",
                      },
                      {
                        step: "05",
                        title: "After launch",
                        body: "Post-launch support is included for the first two weeks. Teams that keep shipping move onto a monthly retainer for continuous design and build work.",
                      },
                    ].map((item) => (
                      <li key={item.step} className="border-l border-white/10 pl-4">
                        <span className="font-mono text-[10px] tracking-widest text-[#FF3333]">
                          {item.step}
                        </span>
                        <h3 className="font-display text-xl uppercase tracking-wide text-white">
                          {item.title}
                        </h3>
                        <p className="mt-1 max-w-lg font-mono text-xs leading-relaxed text-white/50">
                          {item.body}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {active === "RESUME" && (
                <div className="space-y-6">
                  <div>
                    <span className="font-mono text-xs tracking-widest text-[#FF3333]">CAPABILITIES</span>
                    <h2 className="mt-2 font-display text-4xl uppercase text-white">Resume</h2>
                  </div>
                  <div className="space-y-6">
                    {[
                      {
                        heading: "Practice",
                        rows: [
                          "The Roy Effect — Independent design & no-code studio, Houston TX. Brand systems, UI/UX and shipped web builds for founders and small teams.",
                        ],
                      },
                      {
                        heading: "Services",
                        rows: [
                          "Brand Sprint — identity, type and colour system, brand guide.",
                          "Website / UI-UX — responsive marketing sites and product interfaces.",
                          "Design + Build — end-to-end design through live launch.",
                          "Retainer — ongoing monthly design and build capacity.",
                        ],
                      },
                      {
                        heading: "Tools & stack",
                        rows: [
                          "Design — Figma, prototyping, design systems, motion.",
                          "Build — React, Tailwind CSS, no-code and AI-assisted platforms.",
                          "Commerce & data — Stripe payments, hosted databases, auth, transactional email.",
                        ],
                      },
                    ].map((block) => (
                      <div key={block.heading}>
                        <h3 className="font-mono text-xs uppercase tracking-widest text-[#FF3333]">
                          {block.heading}
                        </h3>
                        <ul className="mt-2 space-y-2">
                          {block.rows.map((row) => (
                            <li
                              key={row}
                              className="max-w-lg font-mono text-xs leading-relaxed text-white/60"
                            >
                              {row}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <p className="font-mono text-[11px] text-white/40">
                    A detailed PDF resume and references are available on request — email
                    rory@theroyeffect.com.
                  </p>
                </div>
              )}


            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
