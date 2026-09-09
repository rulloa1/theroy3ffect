import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, ArrowLeft, Check, FileCheck2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@/components/Logo";
import {
  downloadMyProposalPdf,
  getMyProposal,
  signMyProposal,
} from "@/utils/proposals.functions";

export const Route = createFileRoute("/_authenticated/proposals/$proposalId")({
  head: () => ({
    meta: [
      { title: "Sign Your Proposal — theroyeffect.com" },
      {
        name: "description",
        content: "Review, sign and download your project scope agreement in your client portal.",
      },
      { property: "og:title", content: "Sign Your Proposal — theroyeffect.com" },
      {
        property: "og:description",
        content: "Review, sign and download your project scope agreement.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PortalProposalPage,
});

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);

function PortalProposalPage() {
  const { proposalId } = Route.useParams();
  const queryClient = useQueryClient();
  const fetchProposal = useServerFn(getMyProposal);
  const sign = useServerFn(signMyProposal);
  const downloadPdf = useServerFn(downloadMyProposalPdf);

  const { data: proposal, isLoading } = useQuery({
    queryKey: ["client-proposal", proposalId],
    queryFn: () => fetchProposal({ data: { id: proposalId } }),
  });

  const [signatureName, setSignatureName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatureName.trim()) {
      toast.error("Type your full name to sign");
      return;
    }
    if (!agreed) {
      toast.error("Please confirm you agree to the terms");
      return;
    }

    setIsSigning(true);
    try {
      const res = await sign({ data: { id: proposalId, signatureName: signatureName.trim() } });
      if (!res.success) throw new Error(res.error || "Could not sign");
      toast.success("Proposal signed and returned to Rory");
      await queryClient.invalidateQueries({ queryKey: ["client-proposal", proposalId] });
      await queryClient.invalidateQueries({ queryKey: ["client-proposals"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error signing agreement");
    } finally {
      setIsSigning(false);
    }
  };

  const handleDownload = async () => {
    try {
      toast.info("Preparing your PDF copy…");
      const res = await downloadPdf({ data: { id: proposalId } });
      if (!res.success || !res.pdfBase64) throw new Error(res.error || "Failed");
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${res.pdfBase64}`;
      link.download = res.filename || "proposal.pdf";
      link.click();
      toast.success("Signed copy downloaded");
    } catch {
      toast.error("Could not download the PDF");
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030014] text-white">
        <p className="font-mono text-xs tracking-widest text-[#FF3333]">LOADING AGREEMENT…</p>
      </main>
    );
  }

  if (!proposal) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#030014] px-5 text-center text-white">
        <AlertCircle className="size-10 text-[#FF3333]" />
        <h1 className="mt-4 font-display text-3xl uppercase">Proposal not available</h1>
        <p className="mt-2 font-mono text-xs text-white/50">
          It may not be published yet, or it belongs to another account.
        </p>
        <Link
          to="/portal"
          className="mt-6 border border-white/20 px-5 py-2.5 font-mono text-xs tracking-widest text-white hover:border-[#FF3333]"
        >
          BACK TO DASHBOARD
        </Link>
      </main>
    );
  }

  const isSigned = proposal.status === "signed";

  return (
    <main className="min-h-screen bg-[#030014] px-5 py-14 text-white md:px-10 md:py-20">
      <Toaster />
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Logo variant="compact" size="sm" href="/portal" />
          <Link
            to="/portal"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-white/50 hover:text-white"
          >
            <ArrowLeft className="size-3" /> BACK TO DASHBOARD
          </Link>
        </div>

        <div className="mt-10">
          <div className="inline-flex items-center gap-2 border border-[#FF3333]/30 bg-[#FF3333]/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#FF3333]">
            <FileCheck2 className="size-3.5" />
            PROJECT SCOPE &amp; PROPOSAL AGREEMENT
          </div>
          <h1 className="mt-4 font-display text-4xl uppercase leading-[0.9] sm:text-5xl">
            {proposal.project_title}
          </h1>
          <p className="mt-3 font-mono text-xs text-white/50">
            Prepared for <strong>{proposal.client_name}</strong>
            {proposal.client_company ? ` (${proposal.client_company})` : ""} · Studio: Rory Ulloa
          </p>
        </div>

        {isSigned && (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border border-emerald-500/40 bg-emerald-500/10 p-5 text-emerald-400">
            <div>
              <div className="flex items-center gap-2">
                <Check className="size-5" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider">
                  SIGNED BY {proposal.client_signature_name}
                  {proposal.client_signed_at
                    ? ` ON ${new Date(proposal.client_signed_at).toLocaleDateString()}`
                    : ""}
                </span>
              </div>
              <p className="mt-2 font-mono text-xs text-emerald-300/80">
                Scope and terms are locked. Your signed copy is saved to this project.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="bg-emerald-500 px-4 py-2 font-mono text-xs font-bold text-black hover:opacity-90"
            >
              DOWNLOAD SIGNED PDF ↓
            </button>
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="border border-white/10 bg-white/[0.02] p-5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
              TOTAL INVESTMENT
            </span>
            <p className="mt-1 font-display text-3xl text-[#FF3333]">
              {money(proposal.total_price_cents)}
            </p>
            <p className="mt-1 font-mono text-[11px] text-white/50">
              Deposit to start {money(proposal.deposit_cents)}
            </p>
          </div>
          <div className="border border-white/10 bg-white/[0.02] p-5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
              TIMELINE
            </span>
            <p className="mt-1 font-display text-3xl">{proposal.timeline_weeks}</p>
            <p className="mt-1 font-mono text-[11px] text-white/50">From kickoff</p>
          </div>
          <div className="border border-white/10 bg-white/[0.02] p-5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
              STATUS
            </span>
            <p className="mt-1 font-display text-2xl uppercase text-[#FF3333]">
              {isSigned ? "SIGNED" : "AWAITING SIGNATURE"}
            </p>
            <p className="mt-1 font-mono text-[11px] text-white/50">
              Balance {money(proposal.balance_cents)} at launch
            </p>
          </div>
        </div>

        <section className="mt-8 border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <h2 className="font-display text-2xl uppercase">Scope &amp; deliverables</h2>
          <div className="mt-4 whitespace-pre-wrap font-mono text-xs leading-relaxed text-white/80">
            {proposal.scope_deliverables}
          </div>
        </section>

        <section className="mt-8 border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <h2 className="font-display text-2xl uppercase">Terms of engagement</h2>
          <div className="mt-4 whitespace-pre-wrap border-t border-white/10 pt-4 font-mono text-xs leading-relaxed text-white/70">
            {proposal.terms}
          </div>
        </section>

        <section className="mt-8 border border-[#FF3333]/40 bg-[#0a0a14] p-6 shadow-2xl md:p-8">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#FF3333]">
            DIGITAL SIGNATURE &amp; ACCEPTANCE
          </span>

          {isSigned ? (
            <div className="mt-4 border border-white/10 bg-white/[0.02] p-4 font-mono text-xs">
              <p>
                <strong>Signature:</strong> {proposal.client_signature_name}
              </p>
              <p className="mt-1 text-white/50">
                <strong>Signed:</strong>{" "}
                {proposal.client_signed_at
                  ? new Date(proposal.client_signed_at).toLocaleString()
                  : ""}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSign} className="mt-6 space-y-6">
              <div>
                <label
                  htmlFor="signature-name"
                  className="block font-mono text-xs uppercase tracking-wider text-white/70"
                >
                  Full legal name (digital signature) *
                </label>
                <input
                  id="signature-name"
                  type="text"
                  required
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="mt-2 w-full border border-white/15 bg-[#030014] p-3.5 font-mono text-sm text-white placeholder:text-white/30 focus:border-[#FF3333] focus:outline-none"
                />
              </div>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  required
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 size-4 border-white/20 bg-[#030014]"
                />
                <span className="font-mono text-xs leading-relaxed text-white/80">
                  I, <strong>{signatureName || "the Client"}</strong>, agree to the scope,
                  timeline ({proposal.timeline_weeks}) and payment schedule (
                  {money(proposal.total_price_cents)}) set out above.
                </span>
              </label>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
                <div className="flex items-center gap-2 font-mono text-[11px] text-white/50">
                  <ShieldCheck className="size-4 text-[#FF3333]" />
                  <span>Legally binding digital acceptance. Encrypted &amp; logged.</span>
                </div>
                <button
                  type="submit"
                  disabled={isSigning || !agreed || !signatureName.trim()}
                  className="bg-[#FF3333] px-8 py-3.5 font-mono text-xs font-bold tracking-widest text-black transition-all hover:opacity-90 disabled:opacity-40"
                >
                  {isSigning ? "SIGNING…" : "SIGN & RETURN PROPOSAL →"}
                </button>
              </div>
            </form>
          )}
        </section>

        {!isSigned && (
          <button
            type="button"
            onClick={handleDownload}
            className="mt-6 border border-white/15 px-4 py-2 font-mono text-[10px] tracking-widest text-white hover:border-[#FF3333]"
          >
            DOWNLOAD A COPY ↓
          </button>
        )}
      </div>
    </main>
  );
}
