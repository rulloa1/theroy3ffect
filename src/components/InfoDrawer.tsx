import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Menu, X } from "lucide-react";
import { toast } from "sonner";

const MENU = ["PROJECTS", "BLOG", "ABOUT", "RESUME", "LET'S WORK"] as const;
type MenuItem = (typeof MENU)[number];

const fieldClass =
  "w-full border-0 border-b border-white/30 bg-transparent px-0 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#CCFF00] focus:outline-none focus:ring-0";

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

export function InfoDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [active, setActive] = useState<MenuItem | null>(null);
  const [sending, setSending] = useState(false);

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
                className="flex items-center gap-2 font-mono text-xs tracking-widest text-white/60 hover:text-[#CCFF00]"
              >
                {active ? <ArrowLeft className="size-4" /> : <Menu className="size-4" />}
                {active ? "BACK" : "MENU"}
              </button>
              <button
                type="button"
                aria-label="Close menu"
                onClick={close}
                className="flex size-10 items-center justify-center rounded-full border border-white/15 text-white hover:bg-[#CCFF00] hover:text-black"
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
                        <span className="font-display text-3xl uppercase tracking-wide text-white transition-colors group-hover:text-[#CCFF00] md:text-5xl">
                          {item}
                        </span>
                        <span className="font-mono text-xs text-white/40">↗</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {active === "LET'S WORK" && (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <h2 className="font-display text-4xl uppercase text-[#CCFF00]">Let&apos;s work</h2>
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
                    className="w-full bg-[#CCFF00] px-6 py-4 font-mono text-xs tracking-widest text-black transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {sending ? "SENDING..." : "SEND BRIEF"}
                  </button>
                </form>
              )}

              {active && active !== "LET'S WORK" && (
                <div className="space-y-4">
                  <h2 className="font-display text-4xl uppercase text-[#CCFF00]">{active}</h2>
                  <p className="max-w-md font-mono text-xs leading-relaxed text-white/50">
                    Selected {active.toLowerCase()} content is being curated. Reach out through
                    Let&apos;s Work and I&apos;ll send the full deck.
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
