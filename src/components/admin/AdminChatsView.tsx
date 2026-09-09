import { useState } from "react";
import { MessageCircle, Check } from "lucide-react";
import type { ChatConversation } from "@/utils/chats.functions";

interface Props {
  conversations: ChatConversation[];
  onUpdateStatus: (conversationId: string, status: "new" | "handled") => void;
  date: (value: string | null | undefined) => string;
}

export function AdminChatsView({ conversations, onUpdateStatus, date }: Props) {
  const [openId, setOpenId] = useState<string | null>(conversations[0]?.id ?? null);

  if (conversations.length === 0) {
    return (
      <div className="border border-white/10 bg-white/[0.02] p-10 text-center">
        <MessageCircle className="mx-auto size-6 text-white/30" />
        <p className="mt-4 font-mono text-xs tracking-widest text-white/50">
          NO CHAT CONVERSATIONS YET
        </p>
        <p className="mt-2 font-mono text-[11px] text-white/30">
          Messages sent through the website chat bubble appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {conversations.map((c) => {
        const isOpen = openId === c.id;
        return (
          <div key={c.id} className="border border-white/10 bg-white/[0.02]">
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : c.id)}
              className="flex w-full items-start justify-between gap-4 p-5 text-left"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg text-white">
                    {c.contact_name || "Website chat visitor"}
                  </span>
                  {c.unread_count > 0 && (
                    <span className="bg-[#FF3333] px-2 py-0.5 font-mono text-[10px] font-bold text-black">
                      {c.unread_count} NEW
                    </span>
                  )}
                  {c.status === "handled" && (
                    <span className="border border-white/20 px-2 py-0.5 font-mono text-[10px] text-white/50">
                      HANDLED
                    </span>
                  )}
                </div>
                <p className="mt-2 truncate font-mono text-xs text-white/50">
                  {c.last_message_preview || "—"}
                </p>
                <p className="mt-1 font-mono text-[10px] text-white/30">
                  {[c.contact_email, c.contact_phone].filter(Boolean).join(" · ") || "No contact details yet"}
                  {" · "}
                  {date(c.last_message_at)}
                </p>
              </div>
              <span className="shrink-0 font-mono text-[10px] text-white/40">
                {c.messages.length} MSG
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-white/10 p-5">
                <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                  {c.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[85%] p-3 text-sm ${
                        m.direction === "inbound"
                          ? "bg-white/[0.06] text-white/90"
                          : "ml-auto bg-[#FF3333]/15 text-white/80"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <p className="mt-1 font-mono text-[10px] text-white/30">{date(m.sent_at)}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {c.contact_email && (
                    <a
                      href={`mailto:${c.contact_email}`}
                      className="border border-white/20 px-4 py-2 font-mono text-[11px] tracking-widest text-white/70 hover:border-white/50 hover:text-white"
                    >
                      EMAIL BACK
                    </a>
                  )}
                  {c.contact_phone && (
                    <a
                      href={`tel:${c.contact_phone}`}
                      className="border border-white/20 px-4 py-2 font-mono text-[11px] tracking-widest text-white/70 hover:border-white/50 hover:text-white"
                    >
                      CALL
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(c.id, c.status === "handled" ? "new" : "handled")}
                    className="flex items-center gap-2 bg-[#FF3333] px-4 py-2 font-mono text-[11px] font-bold tracking-widest text-black"
                  >
                    <Check className="size-3" />
                    {c.status === "handled" ? "REOPEN" : "MARK HANDLED"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
