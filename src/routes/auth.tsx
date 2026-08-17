import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { next?: string } =>
    typeof search["next"] === "string" && search["next"].startsWith("/")
      ? { next: search["next"] }
      : {},
  head: () => ({
    meta: [
      { title: "Client Sign In — theroyeffect.com" },
      {
        name: "description",
        content:
          "Sign in to your theroyeffect client account to track commissions, project briefs, invoices and your design retainer.",
      },
      { property: "og:title", content: "Client Sign In — theroyeffect.com" },
      {
        property: "og:description",
        content: "Access your commissions, invoices and retainer in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

function AuthPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) void navigate({ to: next ?? "/account" });
  }, [user, loading, navigate, next]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/account`,
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        toast.success("Account created — check your email to confirm, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast.success("Signed in");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    try {
      await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
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
        <span className="font-mono text-[10px] tracking-widest text-[#DFBA73]">CLIENT ACCESS</span>
        <h1 className="mt-3 font-display text-4xl uppercase leading-[0.9] text-white">
          {mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
        </h1>
        <p className="mt-3 font-mono text-xs leading-relaxed text-white/50">
          Track commissions, briefs, invoices and your retainer. Use the same email you paid with
          and past purchases attach automatically.
        </p>

        <button
          type="button"
          onClick={google}
          className="mt-6 w-full border border-white/20 px-4 py-3 font-mono text-xs tracking-widest text-white transition-colors hover:border-[#FF3333] hover:text-[#FF3333]"
        >
          CONTINUE WITH GOOGLE
        </button>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-white/10" />
          <span className="font-mono text-[10px] tracking-widest text-white/30">OR</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label htmlFor="fullName" className="font-mono text-[10px] tracking-widest text-white/40">
                FULL NAME
              </label>
              <input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                className="mt-1 w-full border border-white/15 bg-transparent px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-[#FF3333]"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="font-mono text-[10px] tracking-widest text-white/40">
              EMAIL
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="mt-1 w-full border border-white/15 bg-transparent px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-[#FF3333]"
            />
          </div>
          <div>
            <label htmlFor="password" className="font-mono text-[10px] tracking-widest text-white/40">
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="mt-1 w-full border border-white/15 bg-transparent px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-[#FF3333]"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[#FF3333] px-4 py-3 font-mono text-xs tracking-widest text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "WORKING…" : mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-5 font-mono text-[11px] tracking-widest text-white/50 transition-colors hover:text-[#FF3333]"
        >
          {mode === "signin" ? "NEED AN ACCOUNT? SIGN UP" : "ALREADY HAVE AN ACCOUNT? SIGN IN"}
        </button>

        <div className="mt-8">
          <Link to="/" className="font-mono text-[11px] tracking-widest text-white/30 hover:text-white">
            ← BACK TO SITE
          </Link>
        </div>
      </div>
    </main>
  );
}
