import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";

const OWNER_EMAIL = "rory@theroyeffect.com";

export default defineTool({
  name: "send_inquiry",
  title: "Send a project inquiry",
  description:
    "Send a new project inquiry to Rory Ulloa. Emails the details to Rory and a confirmation to the sender.",
  inputSchema: {
    name: z.string().trim().min(1).max(100).describe("Sender's full name."),
    email: z.string().trim().email().max(255).describe("Sender's email address."),
    projectType: z
      .string()
      .trim()
      .max(60)
      .optional()
      .describe("Short label for the kind of project, e.g. 'Brand Sprint'."),
    message: z
      .string()
      .trim()
      .min(10)
      .max(2000)
      .describe("What the project is about, scope, timeline and budget."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
  handler: async ({ name, email, projectType, message }) => {
    const submissionId = crypto.randomUUID();
    const templateData = { name, email, projectType: projectType ?? "", message };

    // Await the GHL sync so the fetch isn't killed when the tool returns.
    try {
      const { sendToGhl } = await import("@/lib/ghl/inbound-webhook.server");
      await sendToGhl({
        name,
        email,
        source: "mcp_inquiry",
        projectType,
        message,
        submittedAt: new Date().toISOString(),
        pageUrl: "",
        tags: ["website-lead", "mcp-inquiry"],
      });
    } catch (ghlError) {
      // sendToGhl should never throw, but guard against it defensively.
      console.error("GHL sync error (non-fatal):", ghlError);
    }

    try {
      await sendTemplateEmail("brief-notification", OWNER_EMAIL, {
        templateData,
        idempotencyKey: `mcp-inquiry-notification-${submissionId}`,
        replyTo: email,
      });
      await sendTemplateEmail("brief-confirmation", email, {
        templateData,
        idempotencyKey: `mcp-inquiry-confirmation-${submissionId}`,
        replyTo: OWNER_EMAIL,
      });
    } catch (error) {
      throw new ToolError(
        `Could not send the inquiry: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return {
      content: [
        { type: "text" as const, text: `Inquiry sent to Rory. A confirmation went to ${email}.` },
      ],
      structuredContent: { sent: true, submissionId },
    };
  },
});
