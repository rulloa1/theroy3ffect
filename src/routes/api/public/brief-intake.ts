import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";
import { clientIp, json, requireRateLimit } from "@/lib/http/public-endpoint";

const OWNER_EMAIL = "rory@theroyeffect.com";

const schema = z.object({
  sessionId: z.string().trim().max(255).optional().default(""),
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  company: z.string().trim().max(120).optional().default(""),
  projectType: z.string().trim().min(1, "Pick a project type").max(60),
  goals: z.string().trim().min(10, "Tell me a bit more about your goals").max(2000),
  audience: z.string().trim().max(1000).optional().default(""),
  deliverables: z.string().trim().max(1000).optional().default(""),
  referencesLinks: z.string().trim().max(1000).optional().default(""),
  budget: z.string().trim().max(60).optional().default(""),
  timeline: z.string().trim().max(60).optional().default(""),
  extra: z.string().trim().max(2000).optional().default(""),
  smsService: z.boolean().optional().default(false),
  smsMarketing: z.boolean().optional().default(false),
});

export const Route = createFileRoute("/api/public/brief-intake")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Every call renders a PDF, stores it and sends two emails, so this is
        // capped per IP and again across all callers to bound the total cost.
        const throttled =
          (await requireRateLimit(`brief-intake:${clientIp(request)}`, {
            limit: 5,
            windowSeconds: 3600,
          })) ?? (await requireRateLimit("brief-intake:all", { limit: 200, windowSeconds: 3600 }));
        if (throttled) return throttled;

        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return json({ error: "Invalid request body" }, 400);
        }

        const parsed = schema.safeParse(payload);
        if (!parsed.success) {
          return json({ error: parsed.error.issues[0]?.message ?? "Invalid submission" }, 400);
        }

        const d = parsed.data;
        const briefId = crypto.randomUUID();

        // Only trust a session id Stripe confirms as a completed checkout.
        let verifiedSessionId: string | null = null;
        let sessionUserId: string | null = null;
        if (d.sessionId && /^cs_[a-zA-Z0-9_]+$/.test(d.sessionId)) {
          const { createStripeClient } = await import("@/lib/stripe.server");
          const envs: Array<"sandbox" | "live"> = process.env["STRIPE_LIVE_API_KEY"]
            ? ["live", "sandbox"]
            : ["sandbox"];
          for (const env of envs) {
            try {
              const stripe = createStripeClient(env);
              const session = await stripe.checkout.sessions.retrieve(d.sessionId);
              if (session.status === "complete" && session.payment_status !== "unpaid") {
                verifiedSessionId = session.id;
                sessionUserId = session.metadata?.["user_id"] ?? null;
              }
              break;
            } catch {
              // Session belongs to the other environment (or doesn't exist).
            }
          }
        }

        // Build the PDF summary and store it privately.
        let pdfUrl = "";
        let pdfPath: string | null = null;
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { buildBriefPdf } = await import("@/lib/brief-pdf.server");
          const pdfBytes = await buildBriefPdf({
            ...d,
            submittedAt: new Date().toISOString().slice(0, 10),
          });
          const safeName =
            d.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .slice(0, 40) || "client";
          pdfPath = `${new Date().getUTCFullYear()}/${briefId}-${safeName}.pdf`;
          const { error: uploadError } = await supabaseAdmin.storage
            .from("brief-pdfs")
            .upload(pdfPath, pdfBytes, { contentType: "application/pdf", upsert: true });
          if (uploadError) {
            console.error("Brief PDF upload failed:", uploadError.message);
            pdfPath = null;
          } else {
            const { data: signed, error: signError } = await supabaseAdmin.storage
              .from("brief-pdfs")
              .createSignedUrl(pdfPath, 60 * 60 * 24 * 365);
            if (signError) console.error("Brief PDF sign failed:", signError.message);
            pdfUrl = signed?.signedUrl ?? "";
          }
        } catch (pdfError) {
          console.error("Brief PDF generation failed:", pdfError);
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          let userId: string | null = sessionUserId;
          if (!userId) {
            const { data: profile } = await supabaseAdmin
              .from("profiles")
              .select("id")
              .eq("email", d.email.toLowerCase())
              .maybeSingle();
            userId = profile?.id ?? null;
          }
          const { error } = await supabaseAdmin.from("project_briefs").insert({
            id: briefId,
            pdf_path: pdfPath,
            user_id: userId,
            stripe_session_id: verifiedSessionId,

            name: d.name,
            email: d.email,
            company: d.company || null,
            project_type: d.projectType,
            goals: d.goals,
            audience: d.audience || null,
            deliverables: d.deliverables || null,
            references_links: d.referencesLinks || null,
            budget: d.budget || null,
            timeline: d.timeline || null,
            extra: d.extra || null,
            sms_service_consent: d.smsService,
            sms_marketing_consent: d.smsMarketing,
            consent_captured_at: new Date().toISOString(),
          });
          if (error) console.error("Brief insert failed:", error.message);
        } catch (dbError) {
          console.error("Brief insert threw:", dbError);
        }

        // Fire-and-forget sync to GoHighLevel; never blocks the submission.
        void import("@/lib/ghl/inbound-webhook.server").then(({ sendToGhl }) =>
          sendToGhl({
            name: d.name,
            email: d.email,
            source: "website_brief",
            projectType: d.projectType,
            message: d.goals,
            company: d.company,
            budget: d.budget,
            timeline: d.timeline,
            smsServiceConsent: d.smsService,
            smsMarketingConsent: d.smsMarketing,
            consentCapturedAt: new Date().toISOString(),
            submittedAt: new Date().toISOString(),
            tags: ["website-lead", "project-brief"],
          }),
        );
        }

        try {
          await sendTemplateEmail("project-brief-notification", OWNER_EMAIL, {
            templateData: { ...d, sessionId: d.sessionId, pdfUrl },
            idempotencyKey: `project-brief-notification-${briefId}`,
            replyTo: d.email,
          });

          await sendTemplateEmail("brief-confirmation", d.email, {
            templateData: {
              name: d.name,
              projectType: d.projectType,
              message: d.goals,
              pdfUrl,
            },
            idempotencyKey: `project-brief-confirmation-${briefId}`,
            replyTo: OWNER_EMAIL,
          });
        } catch (mailError) {
          console.error("Brief emails failed:", mailError);
          return json({ error: "Saved, but the confirmation email failed to send." }, 502);
        }

        return json({ ok: true });
      },
    },
  },
});
