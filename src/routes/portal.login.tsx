import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { LockKeyhole, Mail } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/portal/login")({
  head: () => ({
    meta: [
      { title: "Client Portal Sign In — theroyeffect.com" },
      {
        name: "description",
        content:
          "Private sign-in for theroyeffect clients: project timelines, milestones, deliverables and invoices in one dashboard.",
      },
      { property: "og:title", content: "Client Portal Sign In — theroyeffect.com" },
      {
        property: "og:description",
        content: "Sign in to your project dashboard: timelines, deliverables and invoices.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PortalLoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

const inputClass =
  "w-full border border-white/15 bg-transparent px-3 py-3 font-mono text-sm text-white placeholder:text-white/25 focus:border-[#FF3333] focus:outline-none";

function PortalLoginPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // Clients land straight in the dashboard — never on an admin surface.
  useEffect(() => {
    if (!loading && user) void navigate({ to: "/portal", replace: true });
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      if (error) throw error;
      toast.success("Welcome back");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  const magicLink = async () => {
    const parsed = z.string().email().safeParse(email.trim());
    if (!parsed.success) {
      toast.error("Enter your email first");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: parsed.data,
        options: { emailRedirectTo: `${window.location.origin}/portal` },
      });
      if (error) throw error;
      toast.success("Check your inbox for a sign-in link");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send the link");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    try {
      await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/portal/login`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in failed");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#030014] px-5 py-24">
      <Toaster />
      <div className="w-full max-w-md border border-white/10 bg-white/[0.02] p-8">
        <div className="mb-6 flex justify-center border-b border-white/10 pb-6">
          <Logo variant="stacked" size="md" href="/" />
        </div>
        <span className="font-mono text-[10px] tracking-widest text-[#FF3333]">
          CLIENT PORTAL ACCESS
        </span>
        <h1 className="mt-3 font-display text-4xl uppercase leading-[0.9] text-white">
          SIGN IN TO YOUR PROJECT
        </h1>
        <p className="mt-3 font-mono text-xs leading-relaxed text-white/50">
          Timelines, milestones, deliverables and invoices — all in one dashboard. Use the email
          address on your project.
        </p>

        <button
          type="button"
          onClick={google}
          className="mt-6 w-full border border-white/20 px-4 py-3 font-mono text-xs tracking-widest text-white transition-colors hover:border-[#FF3333] hover:text-[#FF3333]"
        >
          CONTINUE WITH GOOGLE
        </button>

        <div className="my-6 flex items-center gap-3 font-mono text-[10px] tracking-widest text-white/25">
          <span className="h-px flex-1 bg-white/10" /> OR <span className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            autoComplete="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 bg-[#FF3333] px-4 py-3 font-mono text-xs font-bold tracking-widest text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <LockKeyhole className="size-3.5" /> ENTER PORTAL
          </button>
        </form>

        <button
          type="button"
          onClick={magicLink}
          disabled={busy}
          className="mt-3 flex w-full items-center justify-center gap-2 border border-white/15 px-4 py-3 font-mono text-[11px] tracking-widest text-white/70 transition-colors hover:border-white/40 hover:text-white disabled:opacity-50"
        >
          <Mail className="size-3.5" /> EMAIL ME A SIGN-IN LINK
        </button>

        <p className="mt-6 font-mono text-[11px] leading-relaxed text-white/35">
          Don&apos;t have access yet? Email{" "}
          <a href="mailto:rory@theroyeffect.com" className="text-[#FF3333] underline">
            rory@theroyeffect.com
          </a>{" "}
          and I&apos;ll set your portal up.
        </p>
        <Link
          to="/"
          className="mt-4 inline-block font-mono text-[11px] tracking-widest text-white/40 hover:text-white"
        >
          ← BACK TO SITE
        </Link>
      </div>
    </main>
  );
}
