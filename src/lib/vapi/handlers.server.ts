import { z } from "zod";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";
import {
  BOOKING_TZ,
  OWNER_EMAIL,
  QUESTIONNAIRE_URL,
  SITE,
  SLOT_MINUTES,
  formatSlot,
  getAvailableSlots,
  upsertLead,
} from "@/utils/booking.server";
import {
  bookDiscoveryCallSchema,
  captureLeadSchema,
  createAuditRequestSchema,
  createHumanFollowupSchema,
  getAvailabilitySchema,
  sendApprovedFollowupSchema,
  sendOnboardingQuestionnaireSchema,
  type ToolName,
} from "./schemas";

const AUDIT_URL = `${SITE}/audit`;

async function admin() {
  const mod = await import("@/integrations/supabase/client.server");
  return (mod as unknown as { supabaseAdmin: any }).supabaseAdmin;
}

async function notifyOwner(subjectLine: string, details: Record<string, string | undefined>) {
  try {
    await sendTemplateEmail("voice-agent-notification", OWNER_EMAIL, {
      templateData: { subjectLine, details },
      idempotencyKey: `voice-${crypto.randomUUID()}`,
    });
  } catch (error) {
    console.error("Voice agent owner notification failed:", error);
  }
}

async function sendLeadEmail(
  to: string,
  heading: string,
  body: string,
  ctaLabel?: string,
  ctaUrl?: string,
) {
  return sendTemplateEmail("voice-agent-followup", to, {
    templateData: { heading, body, ctaLabel, ctaUrl },
    idempotencyKey: `voice-followup-${crypto.randomUUID()}`,
    replyTo: OWNER_EMAIL,
  });
}

type Handler = (args: unknown, callId: string | null) => Promise<Record<string, unknown>>;

export const handlers: Record<ToolName, Handler> = {
  capture_lead: async (args, callId) => {
    const data = captureLeadSchema.parse(args);
    const leadId = await upsertLead(
      {
        full_name: data.full_name,
        company_name: data.company_name ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        website_url: data.website_url ?? null,
        project_type: data.project_type,
        primary_goal: data.primary_goal ?? null,
        target_audience: data.target_audience ?? null,
        timeline: data.timeline ?? null,
        budget_range: data.budget_range ?? null,
        notes: data.notes ?? null,
        consent_to_follow_up: data.consent_to_follow_up,
        stage: "new",
      },
      callId,
    );

    await notifyOwner("New voice lead captured", {
      Name: data.full_name,
      Company: data.company_name,
      Email: data.email,
      Phone: data.phone,
      Website: data.website_url,
      "Project type": data.project_type,
      Goal: data.primary_goal,
      Timeline: data.timeline,
      Budget: data.budget_range,
    });

    return { status: "saved", lead_id: leadId, stage: "new" };
  },

  create_audit_request: async (args, callId) => {
    const data = createAuditRequestSchema.parse(args);
    const db = await admin();
    const leadId = await upsertLead(
      {
        full_name: data.full_name,
        email: data.email,
        website_url: data.website_url,
        project_type: "free_audit",
        consent_to_follow_up: data.consent_to_email,
        stage: "audit_in_progress",
      },
      callId,
    );

    const { data: row, error } = await db
      .from("voice_audit_requests")
      .insert({
        lead_id: leadId,
        full_name: data.full_name,
        email: data.email,
        website_url: data.website_url,
        primary_bottleneck: data.primary_bottleneck ?? null,
        consent_to_email: data.consent_to_email,
        vapi_call_id: callId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    if (data.consent_to_email) {
      await sendLeadEmail(
        data.email,
        "Your free audit request is in",
        `Thanks${data.full_name ? `, ${data.full_name.split(" ")[0]}` : ""} — Rory will review ${data.website_url} and send your audit shortly.${data.primary_bottleneck ? ` Noted bottleneck: ${data.primary_bottleneck}.` : ""}`,
        "See what the audit covers",
        AUDIT_URL,
      ).catch((e) => console.error("Audit acknowledgement failed:", e));
    }

    await notifyOwner("Free audit requested", {
      Name: data.full_name,
      Email: data.email,
      Website: data.website_url,
      Bottleneck: data.primary_bottleneck,
    });

    return { status: "audit_in_progress", audit_request_id: row.id, lead_id: leadId };
  },

  get_discovery_availability: async (args) => {
    getAvailabilitySchema.parse(args ?? {});
    const open = await getAvailableSlots(3);

    return {
      time_zone: BOOKING_TZ,
      duration_minutes: SLOT_MINUTES,
      slots: open.map((slot) => ({ slot_start: slot.toISOString(), spoken: formatSlot(slot) })),
    };
  },

  book_discovery_call: async (args, callId) => {
    const data = bookDiscoveryCallSchema.parse(args);
    const start = new Date(data.slot_start);
    if (Number.isNaN(start.getTime()) || start.getTime() < Date.now()) {
      return { status: "unavailable", reason: "That time is no longer available." };
    }
    const end = new Date(start.getTime() + SLOT_MINUTES * 60_000);
    const db = await admin();

    const { data: clash } = await db
      .from("voice_bookings")
      .select("id")
      .eq("slot_start", start.toISOString())
      .eq("status", "scheduled")
      .limit(1)
      .maybeSingle();
    if (clash?.id) {
      return { status: "unavailable", reason: "That time was just taken." };
    }

    const leadId = await upsertLead(
      {
        full_name: data.full_name,
        email: data.email,
        phone: data.phone ?? null,
        consent_to_follow_up: true,
        stage: "discovery_scheduled",
      },
      callId,
    );

    const { data: row, error } = await db
      .from("voice_bookings")
      .insert({
        lead_id: leadId,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone ?? null,
        slot_start: start.toISOString(),
        slot_end: end.toISOString(),
        time_zone: data.time_zone,
        status: "scheduled",
        vapi_call_id: callId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const spoken = formatSlot(start);
    await sendLeadEmail(
      data.email,
      "Your discovery call is booked",
      `You're set for a 15-minute discovery call on ${spoken} (${BOOKING_TZ}). Please complete the short intake so Rory can prepare.`,
      "Complete your intake",
      QUESTIONNAIRE_URL,
    ).catch((e) => console.error("Discovery confirmation failed:", e));

    await notifyOwner("Discovery call booked", {
      Name: data.full_name,
      Email: data.email,
      Phone: data.phone,
      When: `${spoken} (${BOOKING_TZ})`,
      Notes: data.notes,
    });

    return { status: "scheduled", booking_id: row.id, spoken_time: spoken, time_zone: BOOKING_TZ };
  },

  send_approved_followup: async (args) => {
    const data = sendApprovedFollowupSchema.parse(args);
    const first = data.first_name ? `Hi ${data.first_name}, ` : "";
    const copy: Record<string, { heading: string; body: string; ctaLabel?: string; ctaUrl?: string }> = {
      audit_acknowledgement: {
        heading: "Your free audit request is in",
        body: `${first}Rory will review your site and send your audit shortly.`,
        ctaLabel: "See what the audit covers",
        ctaUrl: AUDIT_URL,
      },
      discovery_confirmation: {
        heading: "Your discovery call is confirmed",
        body: `${first}your 15-minute discovery call is confirmed. Details are in your calendar invite.`,
      },
      onboarding_questionnaire: {
        heading: "Quick intake before your call",
        body: `${first}please complete this short intake so Rory can prepare for your call.`,
        ctaLabel: "Complete your intake",
        ctaUrl: QUESTIONNAIRE_URL,
      },
      human_followup_acknowledgement: {
        heading: "Your request has been sent to The Roy Effect",
        body: `${first}thanks for reaching out. Your request has been shared with Rory, who will follow up${data.variables?.["followup_method"] ? ` by ${data.variables["followup_method"]}` : ""}.`,
      },
      missed_call_reschedule: {
        heading: "Let's find another time",
        body: `${first}we missed you for the discovery call. Reply to this email with a time that works and we'll get it rebooked.`,
      },
    };

    const chosen = copy[data.template_id]!;
    const result = await sendLeadEmail(
      data.email,
      chosen.heading,
      chosen.body,
      chosen.ctaLabel,
      chosen.ctaUrl,
    );
    return { status: result.sent ? "sent" : "suppressed", template_id: data.template_id };
  },

  send_onboarding_questionnaire: async (args) => {
    const data = sendOnboardingQuestionnaireSchema.parse(args);
    const result = await sendLeadEmail(
      data.email,
      "Quick intake before your call",
      `${data.first_name ? `Hi ${data.first_name}, ` : ""}please complete this short intake so Rory can prepare for your call.`,
      "Complete your intake",
      QUESTIONNAIRE_URL,
    );
    return { status: result.sent ? "sent" : "suppressed" };
  },

  create_human_followup: async (args, callId) => {
    const data = createHumanFollowupSchema.parse(args);
    const db = await admin();

    let leadId: string | null = null;
    if (data.email && data.full_name) {
      leadId = await upsertLead(
        {
          full_name: data.full_name,
          email: data.email,
          phone: data.phone ?? null,
          consent_to_follow_up: data.consent_to_email,
          stage: "human_followup_required",
        },
        callId,
      );
    }

    const { data: row, error } = await db
      .from("voice_followups")
      .insert({
        lead_id: leadId,
        full_name: data.full_name ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        reason: data.reason,
        urgency: data.urgency,
        summary: data.summary,
        preferred_method: data.preferred_method ?? null,
        vapi_call_id: callId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    if (data.email && data.consent_to_email) {
      await sendLeadEmail(
        data.email,
        "Your request has been sent to The Roy Effect",
        `${data.full_name ? `Hi ${data.full_name.split(" ")[0]}, ` : ""}thanks for reaching out. Your request has been shared with Rory, who will follow up${data.preferred_method ? ` by ${data.preferred_method}` : " shortly"}.`,
      ).catch((e) => console.error("Follow-up acknowledgement failed:", e));
    }

    await notifyOwner(`Human follow-up required (${data.urgency})`, {
      Name: data.full_name,
      Email: data.email,
      Phone: data.phone,
      Reason: data.reason,
      Summary: data.summary,
      "Preferred method": data.preferred_method,
    });

    return { status: "human_followup_required", followup_id: row.id };
  },
};

export async function runTool(name: string, args: unknown, callId: string | null) {
  const handler = handlers[name as ToolName];
  if (!handler) throw new Error(`Unknown tool: ${name}`);
  try {
    return await handler(args, callId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid arguments: ${error.issues[0]?.message ?? "validation failed"}`);
    }
    throw error;
  }
}

export async function logToolCall(entry: {
  callId: string | null;
  toolName: string;
  request: unknown;
  result: unknown;
  ok: boolean;
  errorMessage?: string;
}) {
  try {
    const db = await admin();
    await db.from("voice_agent_logs").insert({
      vapi_call_id: entry.callId,
      tool_name: entry.toolName,
      request_payload: entry.request ?? {},
      result_payload: entry.result ?? {},
      ok: entry.ok,
      error_message: entry.errorMessage ?? null,
    });
  } catch (error) {
    console.error("Voice agent log insert failed:", error);
  }
}

/** Persist status updates / end-of-call reports so admins can read the transcript later. */
export async function recordCallEvent(message: any, callId: string | null) {
  if (!callId) return;
  try {
    const db = await admin();
    const type = String(message?.type ?? "");
    const artifact = message?.artifact ?? {};
    const transcript: string | null =
      message?.transcript ?? artifact?.transcript ?? message?.call?.transcript ?? null;
    const messages = message?.messages ?? artifact?.messages ?? null;
    const isEnd = type === "end-of-call-report" || Boolean(message?.endedReason);

    const row: Record<string, unknown> = {
      vapi_call_id: callId,
      status: isEnd ? "ended" : (message?.status ?? "in_progress"),
      raw_payload: message ?? {},
      updated_at: new Date().toISOString(),
    };
    if (transcript) row["transcript"] = transcript;
    if (message?.summary ?? artifact?.summary) row["summary"] = message?.summary ?? artifact?.summary;
    if (message?.recordingUrl ?? artifact?.recordingUrl)
      row["recording_url"] = message?.recordingUrl ?? artifact?.recordingUrl;
    if (message?.endedReason) row["ended_reason"] = message.endedReason;
    if (Array.isArray(messages)) row["messages"] = messages;
    if (message?.startedAt ?? message?.call?.createdAt)
      row["started_at"] = new Date(message?.startedAt ?? message?.call?.createdAt).toISOString();
    if (isEnd) row["ended_at"] = new Date(message?.endedAt ?? Date.now()).toISOString();

    await db.from("voice_call_records").upsert(row, { onConflict: "vapi_call_id" });
  } catch (error) {
    console.error("Voice call record upsert failed:", error);
  }
}
