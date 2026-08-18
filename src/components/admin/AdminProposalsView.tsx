import { useState } from "react";
import { Copy, Download, ExternalLink, FileCheck, Plus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import type { ProjectProposal } from "@/utils/proposals.functions";

export interface AdminProposalsViewProps {
  proposals: ProjectProposal[];
  onCreateProposal: () => void;
  onDeleteProposal: (proposalId: string) => Promise<void>;
  money: (cents: number, currency: string) => string;
  date: (value: string | null) => string;
}

export function AdminProposalsView({
  proposals,
  onCreateProposal,
  onDeleteProposal,
  money,
  date,
}: AdminProposalsViewProps) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const copyProposalLink = (token: string) => {
    const link = `${window.location.origin}/proposal/${token}`;
    void navigator.clipboard.writeText(link);
    setCopiedToken(token);
    toast.success("Proposal link copied to clipboard");
    setTimeout(() => setCopiedToken(null), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="font-display text-xl uppercase text-white">Project Scope Proposals</h2>
          <p className="mt-1 font-mono text-xs text-white/50">
            Generate 1-click custom scope agreements & digital signatures for clients.
          </p>
        </div>
        <button
          onClick={onCreateProposal}
          className="inline-flex items-center gap-2 bg-[#FF3333] px-4 py-2 font-mono text-xs font-bold tracking-widest text-black transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          CREATE PROPOSAL
        </button>
      </div>

      {proposals.length === 0 ? (
        <div className="border border-dashed border-white/10 py-16 text-center">
          <FileCheck className="mx-auto size-8 text-white/20" />
          <p className="mt-3 font-mono text-xs text-white/40">No client proposals generated yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
          {proposals.map((prop) => {
            const isSigned = prop.status === "signed";

            return (
              <div
                key={prop.id}
                className="flex flex-col justify-between border border-white/10 bg-white/[0.01] p-5 transition-colors hover:border-white/20"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-display text-lg uppercase tracking-wide text-white">
                        {prop.client_name}
                      </span>
                      {prop.client_company && (
                        <p className="font-mono text-xs text-white/50">{prop.client_company}</p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 font-mono text-[9px] tracking-widest uppercase font-bold ${
                        isSigned
                          ? "bg-emerald-500 text-black font-bold"
                          : prop.status === "sent"
                            ? "bg-blue-500 text-black"
                            : "border border-white/20 text-white/50"
                      }`}
                    >
                      {prop.status}
                    </span>
                  </div>

                  <p className="mt-3 font-mono text-xs font-semibold text-[#FF3333]">
                    {prop.project_title}
                  </p>
                  <p className="mt-1 font-mono text-xs text-white/60">
                    Total: {money(prop.total_price_cents, "usd")} · Deposit:{" "}
                    {money(prop.deposit_cents, "usd")}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-white/40">
                    Timeline: {prop.timeline_weeks}
                  </p>

                  {isSigned && (
                    <div className="mt-3 border-t border-white/10 pt-2 font-mono text-[10px] text-emerald-400">
                      Signed by {prop.client_signature_name} on{" "}
                      {date(prop.client_signed_at ?? null)}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyProposalLink(prop.share_token)}
                      className="inline-flex items-center gap-1.5 border border-white/15 px-2.5 py-1.5 font-mono text-[10px] tracking-widest text-white hover:border-[#FF3333]"
                    >
                      {copiedToken === prop.share_token ? (
                        <Check className="size-3 text-emerald-400" />
                      ) : (
                        <Copy className="size-3 text-[#FF3333]" />
                      )}
                      {copiedToken === prop.share_token ? "COPIED" : "COPY LINK"}
                    </button>

                    <a
                      href={`/proposal/${prop.share_token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 font-mono text-[10px] tracking-widest text-white hover:bg-white/20"
                    >
                      <ExternalLink className="size-3" />
                      VIEW
                    </a>
                  </div>

                  <button
                    onClick={async () => {
                      if (confirm("Delete this proposal?")) {
                        await onDeleteProposal(prop.id);
                        toast.success("Proposal deleted");
                      }
                    }}
                    className="p-1.5 text-white/40 transition-colors hover:text-red-400"
                    title="Delete proposal"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
