import { useState } from "react";
import { MessageSquare, Mail, Download, Eye, FileText, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import type { AdminBrief, AdminInquiry } from "@/utils/admin.functions";

export interface AdminInquiriesViewProps {
  inquiries: AdminInquiry[];
  briefs: AdminBrief[];
  onUpdateInquiryStatus: (
    inquiryId: string,
    status: "unread" | "replied" | "archived",
  ) => Promise<void>;
  onViewBrief: (brief: AdminBrief) => void;
  date: (value: string | null) => string;
}

export function AdminInquiriesView({
  inquiries,
  briefs,
  onUpdateInquiryStatus,
  onViewBrief,
  date,
}: AdminInquiriesViewProps) {
  const [inquiryTab, setInquiryTab] = useState<"inquiries" | "briefs">("inquiries");

  return (
    <div className="space-y-6">
      {/* Sub-navigation tabs */}
      <div className="flex border-b border-white/10 pb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setInquiryTab("inquiries")}
            className={`px-3 py-1.5 font-mono text-[10px] tracking-widest transition-colors ${
              inquiryTab === "inquiries"
                ? "bg-[#FF3333] font-bold text-black"
                : "border border-white/10 text-white/60 hover:border-white/30 hover:text-white"
            }`}
          >
            CONTACT INQUIRIES ({inquiries.length})
          </button>
          <button
            onClick={() => setInquiryTab("briefs")}
            className={`px-3 py-1.5 font-mono text-[10px] tracking-widest transition-colors ${
              inquiryTab === "briefs"
                ? "bg-[#FF3333] font-bold text-black"
                : "border border-white/10 text-white/60 hover:border-white/30 hover:text-white"
            }`}
          >
            STANDALONE BRIEFS ({briefs.length})
          </button>
        </div>
      </div>

      {inquiryTab === "inquiries" ? (
        inquiries.length === 0 ? (
          <div className="border border-dashed border-white/10 py-16 text-center">
            <MessageSquare className="mx-auto size-8 text-white/20" />
            <p className="mt-3 font-mono text-xs text-white/40">No contact form submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="border border-white/10 bg-white/[0.01] p-5 transition-colors hover:border-white/20"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-xl uppercase tracking-wide text-white">
                        {inquiry.name}
                      </span>
                      {inquiry.company && (
                        <span className="font-mono text-xs text-white/40">({inquiry.company})</span>
                      )}
                      <span
                        className={`px-2 py-0.5 font-mono text-[9px] tracking-widest ${
                          inquiry.status === "unread"
                            ? "bg-[#FF3333] text-black font-bold"
                            : inquiry.status === "replied"
                              ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                              : "border border-white/20 text-white/40"
                        }`}
                      >
                        {inquiry.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-white/60">
                      {inquiry.email} · {date(inquiry.created_at)}
                    </p>
                    {inquiry.services && inquiry.services.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {inquiry.services.map((svc) => (
                          <span
                            key={svc}
                            className="border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[9px] text-white/70"
                          >
                            {svc}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`mailto:${inquiry.email}?subject=RE: Studio Inquiry`}
                      onClick={() => onUpdateInquiryStatus(inquiry.id, "replied")}
                      className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 font-mono text-[10px] tracking-widest text-white hover:bg-white/20"
                    >
                      <Mail className="size-3" />
                      REPLY VIA EMAIL
                    </a>

                    {inquiry.status === "unread" && (
                      <button
                        onClick={async () => {
                          await onUpdateInquiryStatus(inquiry.id, "replied");
                          toast.success("Marked as replied");
                        }}
                        className="border border-white/15 px-2.5 py-1.5 font-mono text-[10px] text-white/60 hover:text-white"
                      >
                        MARK REPLIED
                      </button>
                    )}
                  </div>
                </div>

                <p className="mt-4 border-t border-white/5 pt-3 font-mono text-xs leading-relaxed text-white/80 whitespace-pre-wrap">
                  {inquiry.message}
                </p>
              </div>
            ))}
          </div>
        )
      ) : briefs.length === 0 ? (
        <div className="border border-dashed border-white/10 py-16 text-center">
          <FileText className="mx-auto size-8 text-white/20" />
          <p className="mt-3 font-mono text-xs text-white/40">No standalone project briefs yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {briefs.map((brief) => (
            <div
              key={brief.id}
              className="border border-white/10 bg-white/[0.01] p-5 transition-colors hover:border-white/20"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xl uppercase tracking-wide text-white">
                      {brief.name}
                    </span>
                    {brief.company && (
                      <span className="font-mono text-xs text-white/40">({brief.company})</span>
                    )}
                    <span className="border border-[#FF3333]/40 bg-[#FF3333]/10 px-2 py-0.5 font-mono text-[9px] tracking-widest text-[#FF3333]">
                      {brief.project_type.toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-white/60">
                    {brief.email} · Submitted {date(brief.created_at)}
                  </p>
                  <p className="mt-2 font-mono text-xs text-white/80 line-clamp-2">
                    <span className="text-[#FF3333]">GOALS:</span> {brief.goals}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewBrief(brief)}
                    className="inline-flex items-center gap-1.5 border border-white/15 px-3 py-1.5 font-mono text-[10px] tracking-widest text-white hover:border-[#FF3333]"
                  >
                    <Eye className="size-3 text-[#FF3333]" />
                    DETAILS
                  </button>
                  {brief.pdf_url && (
                    <a
                      href={brief.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-[#FF3333] px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest text-black hover:opacity-90"
                    >
                      <Download className="size-3" />
                      PDF
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
