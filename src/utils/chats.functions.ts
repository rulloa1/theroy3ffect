import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/utils/require-admin";

export interface ChatMessage {
  id: string;
  direction: "inbound" | "outbound";
  body: string;
  sent_at: string;
}

export interface ChatConversation {
  id: string;
  lead_id: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: string;
  unread_count: number;
  last_message_at: string;
  last_message_preview: string | null;
  created_at: string;
  messages: ChatMessage[];
}

export const adminListChats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ conversations: ChatConversation[] }> => {
    await assertAdmin(context as never);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = context.supabase as any;

    const { data: conversations } = await db
      .from("chat_conversations")
      .select("*")
      .order("last_message_at", { ascending: false })
      .limit(100);

    const list = conversations ?? [];
    if (list.length === 0) return { conversations: [] };

    const { data: messages } = await db
      .from("chat_messages")
      .select("id, conversation_id, direction, body, sent_at")
      .in(
        "conversation_id",
        list.map((c: { id: string }) => c.id),
      )
      .order("sent_at", { ascending: true });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const byConversation = new Map<string, ChatMessage[]>();
    for (const m of messages ?? []) {
      const arr = byConversation.get(m.conversation_id) ?? [];
      arr.push({ id: m.id, direction: m.direction, body: m.body, sent_at: m.sent_at });
      byConversation.set(m.conversation_id, arr);
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      conversations: list.map((c: any) => ({
        id: c.id,
        lead_id: c.lead_id ?? null,
        contact_name: c.contact_name ?? null,
        contact_email: c.contact_email ?? null,
        contact_phone: c.contact_phone ?? null,
        status: c.status,
        unread_count: c.unread_count ?? 0,
        last_message_at: c.last_message_at,
        last_message_preview: c.last_message_preview ?? null,
        created_at: c.created_at,
        messages: byConversation.get(c.id) ?? [],
      })),
    };
  });

export const adminUpdateChatStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { conversationId: string; status: "new" | "handled" }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = context.supabase as any;
    const { error } = await db
      .from("chat_conversations")
      .update({
        status: data.status,
        unread_count: data.status === "handled" ? 0 : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.conversationId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
