import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";
import { clientIp, json, requireRateLimit } from "@/lib/http/public-endpoint";

const OWNER_EMAIL = "rory@theroyeffect.com";

const briefSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
    email: z.string().trim().email("Enter a valid email").max(255),
    phone: z.string().trim().max(40).optional().default(""),
    projectType: z.string().trim().max(60).optional().default(""),
    message: z.string().trim().max(2000).default(""),
    websiteUrl: z.string().trim().max(255).optional().default(""),
    bottleneck: z.string().trim().max(120).optional().default(""),
    notes: z.string().trim().max(2000).optional().default(""),
    smsService: z.boolean().optional().default(false),
    smsMarketing: z.boolean().optional().default(false),
  })
  .refine((data) => Boolean(data.websiteUrl) || data.message.length >= 10, {
    message: "Tell me a bit more about the project",
    path: ["message"],
  });

export const Route = createFileRoute("/api/public/contact")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Unauthenticated, and it sends mail on every call — throttle per IP.
        const throttled = await requireRateLimit(`contact:${clientIp(request)}`, {
          limit: 5,
          windowSeconds: 3600,
        });
        if (throttled) return throttled;

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

        const {
          name,
          email,
          phone,
          projectType,
          message,
          websiteUrl,
          bottleneck,
          notes,
          smsService,
          smsMarketing,
        } = parsed.data;
        const submissionId = crypto.randomUUID();
        const pageUrl = request.headers.get("referer") ?? "";
        const submittedAt = new Date().toISOString();
        const isAudit = Boolean(websiteUrl);

        // Persist to database so inquiries are visible in Studio Admin dashboard
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("contact_inquiries").insert({
            id: submissionId,
            name,
            email,
            phone: phone || null,
            project_type: projectType || null,
            message,
            website_url: websiteUrl || null,
            bottleneck: bottleneck || null,
            notes: notes || null,
            status: "unread",
            sms_service_consent: smsService,
            sms_marketing_consent: smsMarketing,
            consent_captured_at: submittedAt,
          });
        } catch (dbError) {
          console.error("Contact inquiry DB insert error (non-fatal):", dbError);
        }

        // Await the GHL sync so the fetch isn't killed when the response returns.
        try {
          const { sendToGhl } = await import("@/lib/ghl/inbound-webhook.server");
          await sendToGhl({
            name,
            email,
            phone,
            source: isAudit ? "website_audit_form" : "website_contact_form",
            projectType,
            message,
            websiteUrl,
            bottleneck,
            notes,
            smsServiceConsent: smsService,
            smsMarketingConsent: smsMarketing,
            consentCapturedAt: submittedAt,
            submittedAt,
            pageUrl,
            tags: isAudit
              ? ["website-lead", "audit-request"]
              : ["website-lead", "contact-form"],
          });
        } catch (ghlError) {
          // sendToGhl should never throw, but guard against it defensively.
          console.error("GHL sync error (non-fatal):", ghlError);
        }

        try {
          await sendTemplateEmail("brief-notification", OWNER_EMAIL, {
            templateData: {
              name,
              email,
              phone,
              projectType,
              message,
              websiteUrl,
              bottleneck,
              notes,
              submittedAt,
            },
            idempotencyKey: `brief-notification-${submissionId}`,
            replyTo: email,
          });

          await sendTemplateEmail("brief-confirmation", email, {
            templateData: { name, projectType, message, websiteUrl, notes },
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
