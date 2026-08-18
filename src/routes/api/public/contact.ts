import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";

const OWNER_EMAIL = "rory@theroyeffect.com";

const briefSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().trim().email("Enter a valid email").max(255),
  projectType: z.string().trim().max(60).optional().default(""),
  message: z.string().trim().min(10, "Tell me a bit more about the project").max(2000),
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const Route = createFileRoute("/api/public/contact")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return json({ error: "Invalid request body" }, 400);
        }

        const parsed = briefSchema.safeParse(payload);
        if (!parsed.success) {
          return json({ error: parsed.error.issues[0]?.message ?? "Invalid submission" }, 400);
        }

        const { name, email, projectType, message } = parsed.data;
        const submissionId = crypto.randomUUID();

        // Persist to database so inquiries are visible in Studio Admin dashboard
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("contact_inquiries").insert({
            id: submissionId,
            name,
            email,
            project_type: projectType || null,
            message,
            status: "unread",
          });
        } catch (dbError) {
          console.error("Contact inquiry DB insert error (non-fatal):", dbError);
        }

        try {
          await sendTemplateEmail("brief-notification", OWNER_EMAIL, {
            templateData: { name, email, projectType, message },
            idempotencyKey: `brief-notification-${submissionId}`,
            replyTo: email,
          });

          await sendTemplateEmail("brief-confirmation", email, {
            templateData: { name, projectType, message },
            idempotencyKey: `brief-confirmation-${submissionId}`,
            replyTo: OWNER_EMAIL,
          });
        } catch (error) {
          console.error("Contact brief send failed:", error);
          return json({ error: "Could not send your brief right now." }, 502);
        }

        return json({ ok: true });
      },
    },
  },
});
