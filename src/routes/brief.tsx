import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Logo } from "@/components/Logo";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/brief")({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    session_id?: string | undefined;
    scope_type?: string | undefined;
    scope_estimate?: string | undefined;
  } => ({
    session_id: typeof search["session_id"] === "string" ? search["session_id"] : undefined,
    scope_type: typeof search["scope_type"] === "string" ? search["scope_type"] : undefined,
    scope_estimate:
      typeof search["scope_estimate"] === "string" ? search["scope_estimate"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Project Brief Intake — theroyeffect.com" },
      {
        name: "description",
        content:
          "Share your goals, deliverables, budget and timeline so Rory Ulloa can lock in scope and a start date for your commission.",
      },
      { property: "og:title", content: "Project Brief Intake — theroyeffect.com" },
      {
        property: "og:description",
        content:
          "A short guided brief so your project can start with clear scope, budget and timeline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BriefPage,
});

const PROJECT_TYPES = ["Brand identity", "Website / UI-UX", "Design + Build", "Retainer", "Other"];
const BUDGETS = ["Under $2.5k", "$2.5k – $5k", "$5k – $10k", "$10k+", "Already paid"];
const TIMELINES = ["ASAP", "2–4 weeks", "1–2 months", "Flexible"];

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  company: z.string().trim().max(120),
  projectType: z.string().trim().min(1, "Pick a project type"),
  goals: z.string().trim().min(10, "Tell me a bit more about your goals").max(2000),
  audience: z.string().trim().max(1000),
  deliverables: z.string().trim().max(1000),
  referencesLinks: z.string().trim().max(1000),
  budget: z.string().trim().max(60),
  timeline: z.string().trim().max(60),
  extra: z.string().trim().max(2000),
});

type Form = z.infer<typeof schema>;

const EMPTY: Form = {
  name: "",
  email: "",
  company: "",
  projectType: "",
  goals: "",
  audience: "",
  deliverables: "",
  referencesLinks: "",
  budget: "",
  timeline: "",
  extra: "",
};

const STEPS = [
  { title: "Who you are", fields: ["name", "email", "company"] as const },
  { title: "The project", fields: ["projectType", "goals", "audience"] as const },
  { title: "Scope & references", fields: ["deliverables", "referencesLinks"] as const },
  { title: "Budget & timing", fields: ["budget", "timeline", "extra"] as const },
];

const inputClass =
  "w-full border-b border-white/15 bg-transparent py-3 font-mono text-sm text-white placeholder:text-white/30 focus:border-[#FF3333] focus:outline-none";
const labelClass = "block font-mono text-[10px] tracking-widest text-white/40";

function BriefPage() {
  const {
    session_id: sessionId,
    scope_type: scopeType,
    scope_estimate: scopeEstimate,
  } = Route.useSearch();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(() => ({
    ...EMPTY,
    projectType: scopeType
      ? scopeType.includes("Landing") || scopeType.includes("Website")
        ? "Design + Build"
        : scopeType.includes("Retainer")
          ? "Retainer"
          : "Brand identity"
      : "",
    budget: scopeEstimate ? `$${Number(scopeEstimate).toLocaleString()}` : "",
  }));
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const STORAGE_KEY = `theroy_brief_draft_${sessionId || "general"}`;

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setForm((prev) => ({ ...prev, ...parsed }));
          setLastSaved("Draft restored");
        }
      }
    } catch (_err) {
      // Storage unavailable or blocked
    }
  }, [STORAGE_KEY]);

  // Debounced auto-save to localStorage
  useEffect(() => {
    if (done) return;
    const isDirty = Object.values(form).some((v) => v !== "");
    if (!isDirty) return;

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
        setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } catch (_err) {
        // Storage write failed
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [form, done, STORAGE_KEY]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_err) {
      // Storage remove failed
    }
    setForm(EMPTY);
    setStep(0);
    setLastSaved(null);
    toast.info("Brief draft reset.");
  };

  const set = (key: keyof Form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validateStep = () => {
    const fields = STEPS[step]!.fields as readonly string[];
    const result = schema.safeParse(form);
    if (result.success) return true;
    const issue = result.error.issues.find((i) => fields.includes(String(i.path[0])));
    if (issue) {
      toast.error(issue.message);
      return false;
    }
    return true;
  };

  const next = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/public/brief-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result.data, sessionId: sessionId ?? "" }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Something went wrong");
      }
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (_err) {
        // Storage clean failed
      }
      setDone(true);
      toast.success("Brief received — I'll reply within one business day.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send your brief right now.");
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030014] px-5 py-24">
        <div className="w-full max-w-lg border border-white/10 bg-white/[0.02] p-8">
          <span className="font-mono text-[10px] tracking-widest text-[#FF3333]">
            BRIEF RECEIVED
          </span>
          <h1 className="mt-4 font-display text-4xl uppercase leading-[0.9] text-white">
            THANK YOU
          </h1>
          <p className="mt-4 font-mono text-xs leading-relaxed text-white/60">
            Your brief is with me. I&apos;ll review it and reply within one business day with scope,
            schedule and next steps. A copy is in your inbox.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex items-center gap-2 bg-[#FF3333] px-5 py-3 font-mono text-xs tracking-widest text-black transition-opacity hover:opacity-90"
          >
            BACK TO SITE
          </Link>
        </div>
      </main>
    );
  }

  const current = STEPS[step]!;

  return (
    <main className="min-h-screen bg-[#030014] px-5 py-20">
      <Toaster />
      <div className="mx-auto max-w-2xl">
        <Logo variant="compact" size="md" href="/" className="mb-8" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[10px] tracking-widest text-[#FF3333]">
            {sessionId ? "POST-PURCHASE INTAKE" : "PROJECT INTAKE"}
          </span>
          {lastSaved && (
            <span className="font-mono text-[10px] text-white/40">
              ● {lastSaved.startsWith("Draft") ? lastSaved : `Auto-saved at ${lastSaved}`}
            </span>
          )}
        </div>
        <h1 className="mt-3 font-display text-4xl uppercase leading-[0.9] text-white sm:text-5xl md:text-6xl">
          PROJECT BRIEF
        </h1>
        <p className="mt-4 max-w-lg font-mono text-xs leading-relaxed text-white/50">
          Four short steps. Your progress is saved automatically. The more detail you share, the
          faster we lock scope and kick off your build.
        </p>

        <div className="mt-8 flex gap-2">
          {STEPS.map((s, index) => (
            <div
              key={s.title}
              className={`h-[3px] flex-1 ${index <= step ? "bg-[#FF3333]" : "bg-white/10"}`}
            />
          ))}
        </div>

        <form onSubmit={submit} className="mt-10 space-y-6">
          <h2 className="font-display text-2xl uppercase text-white">
            {step + 1}. {current.title}
          </h2>

          {step === 0 && (
            <>
              <div>
                <label className={labelClass} htmlFor="brief-name">
                  YOUR NAME
                </label>
                <input
                  id="brief-name"
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => set("name")(e.target.value)}
                  placeholder="Jane Doe"
                  maxLength={100}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="brief-email">
                  EMAIL
                </label>
                <input
                  id="brief-email"
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => set("email")(e.target.value)}
                  placeholder="you@company.com"
                  maxLength={255}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="brief-company">
                  COMPANY (OPTIONAL)
                </label>
                <input
                  id="brief-company"
                  className={inputClass}
                  value={form.company}
                  onChange={(e) => set("company")(e.target.value)}
                  placeholder="Northwind"
                  maxLength={120}
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <label className={labelClass} htmlFor="brief-type">
                  PROJECT TYPE
                </label>
                <select
                  id="brief-type"
                  className={`${inputClass} appearance-none`}
                  value={form.projectType}
                  onChange={(e) => set("projectType")(e.target.value)}
                >
                  <option value="" className="bg-[#030014]">
                    Select…
                  </option>
                  {PROJECT_TYPES.map((type) => (
                    <option key={type} value={type} className="bg-[#030014]">
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className={labelClass} htmlFor="brief-goals">
                    WHAT ARE WE TRYING TO ACHIEVE?
                  </label>
                  <span className="font-mono text-[10px] text-white/30">
                    {form.goals.length}/2000
                  </span>
                </div>
                <textarea
                  id="brief-goals"
                  rows={4}
                  className={`${inputClass} resize-none`}
                  value={form.goals}
                  onChange={(e) => set("goals")(e.target.value)}
                  placeholder="Goals, problems to solve, what success looks like…"
                  maxLength={2000}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="brief-audience">
                  WHO IS IT FOR? (OPTIONAL)
                </label>
                <textarea
                  id="brief-audience"
                  rows={2}
                  className={`${inputClass} resize-none`}
                  value={form.audience}
                  onChange={(e) => set("audience")(e.target.value)}
                  placeholder="Audience, market, competitors"
                  maxLength={1000}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className={labelClass} htmlFor="brief-deliverables">
                  DELIVERABLES YOU EXPECT (OPTIONAL)
                </label>
                <textarea
                  id="brief-deliverables"
                  rows={3}
                  className={`${inputClass} resize-none`}
                  value={form.deliverables}
                  onChange={(e) => set("deliverables")(e.target.value)}
                  placeholder="Logo suite, 6-page site, design system, build & launch…"
                  maxLength={1000}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="brief-references">
                  REFERENCES, FIGMA OR ASSET LINKS (OPTIONAL)
                </label>
                <textarea
                  id="brief-references"
                  rows={3}
                  className={`${inputClass} resize-none`}
                  value={form.referencesLinks}
                  onChange={(e) => set("referencesLinks")(e.target.value)}
                  placeholder="Figma links, Google Drive / Dropbox assets, inspiration URLs, current website..."
                  maxLength={1000}
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className={labelClass} htmlFor="brief-budget">
                  BUDGET (OPTIONAL)
                </label>
                <select
                  id="brief-budget"
                  className={`${inputClass} appearance-none`}
                  value={form.budget}
                  onChange={(e) => set("budget")(e.target.value)}
                >
                  <option value="" className="bg-[#030014]">
                    Select…
                  </option>
                  {BUDGETS.map((b) => (
                    <option key={b} value={b} className="bg-[#030014]">
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="brief-timeline">
                  TIMELINE (OPTIONAL)
                </label>
                <select
                  id="brief-timeline"
                  className={`${inputClass} appearance-none`}
                  value={form.timeline}
                  onChange={(e) => set("timeline")(e.target.value)}
                >
                  <option value="" className="bg-[#030014]">
                    Select…
                  </option>
                  {TIMELINES.map((t) => (
                    <option key={t} value={t} className="bg-[#030014]">
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="brief-extra">
                  ANYTHING ELSE? (OPTIONAL)
                </label>
                <textarea
                  id="brief-extra"
                  rows={3}
                  className={`${inputClass} resize-none`}
                  value={form.extra}
                  onChange={(e) => set("extra")(e.target.value)}
                  placeholder="Stakeholders, constraints, hard deadlines"
                  maxLength={2000}
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-between gap-4 pt-4">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(s - 1, 0))}
              disabled={step === 0}
              className="font-mono text-xs tracking-widest text-white/40 transition-colors hover:text-white disabled:opacity-30"
            >
              ← BACK
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="bg-[#FF3333] px-6 py-4 font-mono text-xs tracking-widest text-black transition-opacity hover:opacity-90"
              >
                NEXT STEP
              </button>
            ) : (
              <button
                type="submit"
                disabled={sending}
                className="bg-[#FF3333] px-6 py-4 font-mono text-xs tracking-widest text-black transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {sending ? "SENDING…" : "SEND BRIEF"}
              </button>
            )}
          </div>

          {sessionId && (
            <p className="break-all font-mono text-[10px] text-white/25">
              Linked to payment reference: {sessionId}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
