import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  Clock,
  DollarSign,
  FileCheck2,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@/components/Logo";
import { getPublicProposal, signPublicProposal } from "@/utils/proposals.functions";

export const Route = createFileRoute("/proposal/$token")({
  head: () => ({
    meta: [
      { title: "Project Scope & Proposal Agreement — The Roy Effect" },
      {
        name: "description",
        content:
          "Review and accept your custom project scope, deliverables, timeline, and payment terms.",
      },
      { property: "og:title", content: "Project Scope & Proposal Agreement — The Roy Effect" },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ProposalPage,
});

function ProposalPage() {
  const { token } = Route.useParams();
  const queryClient = useQueryClient();
  const fetchProposal = useServerFn(getPublicProposal);
  const signProposal = useServerFn(signPublicProposal);

  const {
    data: proposal,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["proposal", token],
    queryFn: () => fetchProposal({ data: { token } }),
  });

  const [signatureName, setSignatureName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatureName.trim()) {
      toast.error("Please type your full name for digital signature");
      return;
    }
    if (!agreed) {
      toast.error("Please confirm agreement to the terms");
      return;
    }

    setIsSigning(true);
    try {
      const res = await signProposal({
        data: {
          token,
          signatureName: signatureName.trim(),
        },
      });

      if (!res.success) throw new Error(res.error || "Failed to sign proposal");
      toast.success("Proposal successfully signed and locked!");
      await queryClient.invalidateQueries({ queryKey: ["proposal", token] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error signing agreement");
    } finally {
      setIsSigning(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030014] text-white">
        <p className="font-mono text-xs tracking-widest text-[#DFBA73]">LOADING AGREEMENT…</p>
      </main>
    );
  }

  if (error || !proposal) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#030014] px-5 text-center text-white">
        <AlertCircle className="size-12 text-[#E51924]" />
        <h1 className="mt-4 font-display text-3xl uppercase">Proposal Not Found</h1>
        <p className="mt-2 font-mono text-xs text-white/50">
          This link may have expired or is invalid. Please contact Rory Ulloa for an updated link.
        </p>
        <Link
          to="/"
          className="mt-6 border border-white/20 px-5 py-2.5 font-mono text-xs tracking-widest text-white hover:border-[#DFBA73]"
        >
          RETURN TO HOMEPAGE
        </Link>
      </main>
    );
  }

  const isSigned = proposal.status === "signed";
  const formattedTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(proposal.total_price_cents / 100);

  const formattedDeposit = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(proposal.deposit_cents / 100);

  const formattedBalance = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(proposal.balance_cents / 100);

  return (
    <main className="min-h-screen bg-[#030014] px-5 py-16 text-white md:px-10 md:py-24">
      <Toaster />
      <div className="mx-auto max-w-4xl">
        {/* Top Header */}
        <div className="flex flex-col items-center text-center">
          <Logo variant="stacked" size="lg" href="/" className="mb-6" />
          <div className="inline-flex items-center gap-2 border border-[#DFBA73]/30 bg-[#DFBA73]/10 px-3 py-1 font-mono text-[10px] font-bold tracking-[0.25em] text-[#F6DC9A] uppercase">
            <FileCheck2 className="size-3.5" />
            PROJECT SCOPE &amp; PROPOSAL AGREEMENT
          </div>

          <h1 className="mt-4 font-display text-4xl uppercase leading-[0.9] text-white sm:text-5xl md:text-6xl">
            {proposal.project_title}
          </h1>

          <p className="mt-3 font-mono text-xs text-white/50">
            Prepared for <strong>{proposal.client_name}</strong>
            {proposal.client_company ? ` (${proposal.client_company})` : ""} &bull; Studio: Rory
            Ulloa
          </p>
        </div>

        {/* Signed Status Banner */}
        {isSigned && (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border border-emerald-500/40 bg-emerald-500/10 p-5 text-emerald-400">
            <div>
              <div className="flex items-center gap-2">
                <Check className="size-5" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider">
                  AGREEMENT DULY EXECUTED &bull; SIGNED BY {proposal.client_signature_name} ON{" "}
                  {proposal.client_signed_at
                    ? new Date(proposal.client_signed_at).toLocaleDateString()
                    : ""}
                </span>
              </div>
              <p className="mt-2 font-mono text-xs text-emerald-300/80">
                Scope and terms are locked. Ready to kick off with the 50% deposit.
              </p>
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  const { downloadSignedProposalPdf } = await import("@/utils/proposals.functions");
                  toast.info("Generating PDF summary...");
                  const res = await downloadSignedProposalPdf({ data: { token } });
                  if (!res.success || !res.pdfBase64) throw new Error(res.error || "Failed");

                  const link = document.createElement("a");
                  link.href = `data:application/pdf;base64,${res.pdfBase64}`;
                  link.download = res.filename || "signed-proposal.pdf";
                  link.click();
                  toast.success("Signed proposal PDF downloaded!");
                } catch (_err) {
                  toast.error("Could not download PDF at this time");
                }
              }}
              className="inline-flex items-center gap-2 bg-emerald-500 px-4 py-2 font-mono text-xs font-bold text-black transition-opacity hover:opacity-90"
            >
              DOWNLOAD SIGNED PDF ↓
            </button>
          </div>
        )}

        {/* Executive Summary Grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="border border-white/10 bg-white/[0.02] p-5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
              TOTAL INVESTMENT
            </span>
            <p className="mt-1 font-display text-3xl text-[#E51924]">{formattedTotal}</p>
            <p className="mt-1 font-mono text-[11px] text-white/50">
              50% Deposit: {formattedDeposit}
            </p>
          </div>

          <div className="border border-white/10 bg-white/[0.02] p-5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
              ESTIMATED TIMELINE
            </span>
            <p className="mt-1 font-display text-3xl text-white">{proposal.timeline_weeks}</p>
            <p className="mt-1 font-mono text-[11px] text-white/50">From Direction Kickoff</p>
          </div>

          <div className="border border-white/10 bg-white/[0.02] p-5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
              STATUS
            </span>
            <p className="mt-1 font-display text-2xl uppercase text-[#DFBA73]">
              {isSigned ? "ACCEPTED & SIGNED" : "AWAITING SIGNATURE"}
            </p>
            <p className="mt-1 font-mono text-[11px] text-white/50">
              {isSigned ? "Direction Locked" : "Review Terms Below"}
            </p>
          </div>
        </div>

        {/* Section 1: Scope & Deliverables */}
        <div className="mt-8 border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#DFBA73]">
            SECTION 1
          </span>
          <h2 className="mt-1 font-display text-2xl uppercase text-white">
            SCOPE &amp; INCLUDED DELIVERABLES
          </h2>

          <div className="mt-4 space-y-2 font-mono text-xs text-white/80 whitespace-pre-wrap leading-relaxed">
            {proposal.scope_deliverables}
          </div>
        </div>

        {/* Section 2: Payment Milestones */}
        <div className="mt-8 border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#DFBA73]">
            SECTION 2
          </span>
          <h2 className="mt-1 font-display text-2xl uppercase text-white">
            PAYMENT SCHEDULE &amp; MILESTONES
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="border border-white/10 bg-white/[0.02] p-4">
              <span className="font-mono text-[10px] tracking-widest text-[#DFBA73]">
                MILESTONE 1 (KICKOFF)
              </span>
              <p className="mt-1 font-display text-xl text-white">{formattedDeposit} (50%)</p>
              <p className="mt-1 font-mono text-xs text-white/50">
                Due upon agreement signing. Secures project schedule, visual direction sprint &amp;
                build queue.
              </p>
            </div>

            <div className="border border-white/10 bg-white/[0.02] p-4">
              <span className="font-mono text-[10px] tracking-widest text-white/40">
                MILESTONE 2 (DELIVERY)
              </span>
              <p className="mt-1 font-display text-xl text-white">{formattedBalance} (50%)</p>
              <p className="mt-1 font-mono text-xs text-white/50">
                Due upon final screen approval prior to live domain cutover or codebase &amp; Figma
                asset handover.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Standard Terms & IP */}
        <div className="mt-8 border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#DFBA73]">
            SECTION 3
          </span>
          <h2 className="mt-1 font-display text-2xl uppercase text-white">
            TERMS OF ENGAGEMENT &amp; IP TRANSFER
          </h2>

          <div className="mt-4 space-y-2 border-t border-white/10 pt-4 font-mono text-xs leading-relaxed text-white/70 whitespace-pre-wrap">
            {proposal.terms}
          </div>
        </div>

        {/* Section 4: Digital Signature Form / Action */}
        <div className="mt-8 border border-[#DFBA73]/40 bg-[#0a0a14] p-6 md:p-8 shadow-2xl">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#DFBA73]">
            SECTION 4 &bull; DIGITAL SIGNATURE &amp; ACCEPTANCE
          </span>

          {isSigned ? (
            <div className="mt-4 space-y-4">
              <div className="border border-white/10 bg-white/[0.02] p-4 font-mono text-xs">
                <p className="text-white">
                  <strong>Digital Signature:</strong> {proposal.client_signature_name}
                </p>
                <p className="mt-1 text-white/50">
                  <strong>Signed Timestamp:</strong>{" "}
                  {proposal.client_signed_at
                    ? new Date(proposal.client_signed_at).toLocaleString()
                    : ""}
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  to="/"
                  className="bg-[#E51924] px-6 py-3 font-mono text-xs font-bold tracking-widest text-white hover:bg-[#FF3333]"
                >
                  PROCEED TO KICKOFF DEPOSIT →
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSign} className="mt-6 space-y-6">
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-white/70">
                  Full Legal Name (Digital Signature) *
                </label>
                <input
                  type="text"
                  required
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="mt-2 w-full border border-white/15 bg-[#030014] p-3.5 font-mono text-sm text-white placeholder:text-white/30 focus:border-[#DFBA73] focus:outline-none"
                />
              </div>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  required
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 size-4 rounded border-white/20 bg-[#030014] text-[#DFBA73] focus:ring-0"
                />
                <span className="font-mono text-xs text-white/80 leading-relaxed">
                  I, <strong>{signatureName || "the Client"}</strong>, confirm that I have reviewed
                  and agree to the scope of deliverables, milestone timeline (
                  {proposal.timeline_weeks}), and payment schedule ({formattedTotal}) outlined in
                  this agreement.
                </span>
              </label>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
                <div className="flex items-center gap-2 font-mono text-[11px] text-white/50">
                  <ShieldCheck className="size-4 text-[#DFBA73]" />
                  <span>Legally binding digital acceptance. Encrypted &amp; logged.</span>
                </div>

                <button
                  type="submit"
                  disabled={isSigning || !agreed || !signatureName.trim()}
                  className="bg-[#DFBA73] px-8 py-3.5 font-mono text-xs font-bold tracking-widest text-black transition-all hover:bg-[#F6DC9A] hover:shadow-[0_0_20px_rgba(223,186,115,0.4)] disabled:opacity-40"
                >
                  {isSigning ? "SIGNING…" : "SIGN & ACCEPT PROPOSAL →"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
