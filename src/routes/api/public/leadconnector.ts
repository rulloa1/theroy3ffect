import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { json, timingSafeEqual } from "@/lib/http/public-endpoint";

/**
 * Inbound webhook for the LeadConnector (HighLevel) chat widget.
 *
 * The widget itself lives on the provider's side, so the only way messages
 * reach this site is a workflow webhook posting each message here. Every call
 * carries the shared token from `LEADCONNECTOR_WEBHOOK_TOKEN`, either as the
 * `x-webhook-token` header or a `?token=` query param (HighLevel workflows can
 * do both, depending on plan).
 */

const payloadSchema = z
  .object({
    // conversation / contact identity (HighLevel sends a mix of these)
    conversationId: z.string().trim().max(200).optional(),
    conversation_id: z.string().trim().max(200).optional(),
    contactId: z.string().trim().max(200).optional(),
    contact_id: z.string().trim().max(200).optional(),

    full_name: z.string().trim().max(200).optional(),
    fullName: z.string().trim().max(200).optional(),
    first_name: z.string().trim().max(120).optional(),
    firstName: z.string().trim().max(120).optional(),
    last_name: z.string().trim().max(120).optional(),
    lastName: z.string().trim().max(120).optional(),
    name: z.string().trim().max(200).optional(),

    email: z.string().trim().max(255).optional(),
    phone: z.string().trim().max(60).optional(),

    // message
    message: z.string().max(5000).optional(),
    body: z.string().max(5000).optional(),
    messageId: z.string().trim().max(200).optional(),
    message_id: z.string().trim().max(200).optional(),
    messageType: z.string().trim().max(60).optional(),
    message_type: z.string().trim().max(60).optional(),
    direction: z.string().trim().max(20).optional(),
    dateAdded: z.string().trim().max(60).optional(),
  })
  .passthrough();

function firstString(...values: (string | undefined)[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export const Route = createFileRoute("/api/public/leadconnector")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["LEADCONNECTOR_WEBHOOK_TOKEN"] ?? "";
        const url = new URL(request.url);
        const provided =
          request.headers.get("x-webhook-token") ?? url.searchParams.get("token") ?? "";
        if (!expected || !timingSafeEqual(provided, expected)) {
          return json({ error: "Unauthorized" }, 401);
        }

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ error: "Invalid request body" }, 400);
        }

        const parsed = payloadSchema.safeParse(raw);
        if (!parsed.success) {
          return json({ error: "Invalid payload" }, 400);
        }
        const p = parsed.data;

        const body = firstString(p.message, p.body) ?? "";
        if (!body) return json({ ok: true, skipped: "empty message" });

        const directionRaw = (p.direction ?? "inbound").toLowerCase();
        const direction = directionRaw.startsWith("out") ? "outbound" : "inbound";

        const name =
          firstString(
            p.full_name,
            p.fullName,
            p.name,
            [firstString(p.first_name, p.firstName), firstString(p.last_name, p.lastName)]
              .filter(Boolean)
              .join(" ") || undefined,
          ) ?? "Website chat visitor";
        const email = firstString(p.email);
        const phone = firstString(p.phone);
        const externalConversationId =
          firstString(
            p.conversationId,
            p.conversation_id,
            p.contactId,
            p.contact_id,
            email ?? undefined,
            phone ?? undefined,
          ) ??
          crypto.randomUUID();
        const externalMessageId = firstString(p.messageId, p.message_id);
        const sentAt = (() => {
          const raw = firstString(p.dateAdded);
          const parsedDate = raw ? new Date(raw) : null;
          return parsedDate && !Number.isNaN(+parsedDate)
            ? parsedDate.toISOString()
            : new Date().toISOString();
        })();

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const db = supabaseAdmin as any;

          // 1. Conversation (one per chat visitor)
          const { data: existing } = await db
            .from("chat_conversations")
            .select("id, lead_id, unread_count")
            .eq("external_id", externalConversationId)
            .maybeSingle();

          let conversationId: string = existing?.id ?? "";
          let leadId: string | null = existing?.lead_id ?? null;

          if (!conversationId) {
            const { data: created, error } = await db
              .from("chat_conversations")
              .insert({
                external_id: externalConversationId,
                contact_name: name,
                contact_email: email,
                contact_phone: phone,
                status: "new",
                last_message_at: sentAt,
                last_message_preview: body.slice(0, 240),
                unread_count: direction === "inbound" ? 1 : 0,
              })
              .select("id")
              .single();
            if (error) throw error;
            conversationId = created.id;
          } else {
            await db
              .from("chat_conversations")
              .update({
                contact_name: name,
                contact_email: email ?? undefined,
                contact_phone: phone ?? undefined,
                last_message_at: sentAt,
                last_message_preview: body.slice(0, 240),
                unread_count:
                  direction === "inbound" ? (existing?.unread_count ?? 0) + 1 : (existing?.unread_count ?? 0),
                updated_at: new Date().toISOString(),
              })
              .eq("id", conversationId);
          }

          // 2. Message (idempotent when the provider supplies an id)
          const messageRow = {
            conversation_id: conversationId,
            external_id: externalMessageId,
            direction,
            body,
            message_type: firstString(p.messageType, p.message_type),
            sent_at: sentAt,
          };
          if (externalMessageId) {
            await db.from("chat_messages").upsert(messageRow, { onConflict: "external_id" });
          } else {
            await db.from("chat_messages").insert(messageRow);
          }

          // 3. Link/create a CRM lead so chat visitors land in the pipeline
          if (!leadId && direction === "inbound") {
            let matched: { id: string } | null = null;
            if (email) {
              const { data } = await db
                .from("voice_leads")
                .select("id")
                .ilike("email", email)
                .limit(1)
                .maybeSingle();
              matched = data ?? null;
            }
            if (!matched && phone) {
              const { data } = await db
                .from("voice_leads")
                .select("id")
                .eq("phone", phone)
                .limit(1)
                .maybeSingle();
              matched = data ?? null;
            }
            if (matched) {
              leadId = matched.id;
            } else {
              const { data: newLead } = await db
                .from("voice_leads")
                .insert({
                  full_name: name,
                  email,
                  phone,
                  project_type: "website_chat",
                  notes: `First chat message: ${body.slice(0, 500)}`,
                  consent_to_follow_up: true,
                  stage: "new",
                  source: "chat_widget",
                })
                .select("id")
                .single();
              leadId = newLead?.id ?? null;
            }
            if (leadId) {
              await db.from("chat_conversations").update({ lead_id: leadId }).eq("id", conversationId);
            }
          }

          return json({ ok: true, conversationId, leadId });
        } catch (error) {
          console.error("LeadConnector webhook error:", error);
          return json({ error: "Could not record chat message" }, 500);
        }
      },
    },
  },
});
