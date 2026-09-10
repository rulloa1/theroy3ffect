/**
 * Outbound sync of inbound leads to GoHighLevel via a GHL workflow
 * Inbound Webhook. Fire-and-forget: never throws, never blocks a form
 * submission. The opposite direction (GHL → site) lives in
 * src/routes/api/public/leadconnector.ts.
 */

export interface GhlLeadPayload {
  name?: string | null | undefined;
  email?: string | null | undefined;
  phone?: string | null | undefined;
  source: string;
  projectType?: string | null | undefined;
  message?: string | null | undefined;
  company?: string | null | undefined;
  budget?: string | null | undefined;
  timeline?: string | null | undefined;
  smsServiceConsent?: boolean | undefined;
  smsMarketingConsent?: boolean | undefined;
  consentCapturedAt?: string | null | undefined;
  pageUrl?: string | null | undefined;
  submittedAt?: string | null | undefined;
  tags?: string[] | undefined;
}

/** Flat, stable shape GHL's workflow field mapping can rely on. */
export function normalizeGhlPayload(p: GhlLeadPayload): Record<string, string | boolean> {
  const fullName = (p.name ?? "").trim();
  const firstSpace = fullName.indexOf(" ");
  const firstName = firstSpace === -1 ? fullName : fullName.slice(0, firstSpace);
  const lastName = firstSpace === -1 ? "" : fullName.slice(firstSpace + 1).trim();

  return {
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    email: p.email ?? "",
    phone: p.phone ?? "",
    source: p.source,
    project_type: p.projectType ?? "",
    message: p.message ?? "",
    company: p.company ?? "",
    budget: p.budget ?? "",
    timeline: p.timeline ?? "",
    sms_service_consent: p.smsServiceConsent ?? false,
    sms_marketing_consent: p.smsMarketingConsent ?? false,
    consent_captured_at: p.consentCapturedAt ?? "",
    page_url: p.pageUrl ?? "",
    submitted_at: p.submittedAt ?? new Date().toISOString(),
    tags: (p.tags ?? []).join(","),
  };
}

let loggedMissingUrl = false;

export async function sendToGhl(
  payload: GhlLeadPayload,
): Promise<{ ok: boolean; skipped?: boolean }> {
  const url = process.env["GHL_INBOUND_WEBHOOK_URL"];
  if (!url) {
    if (!loggedMissingUrl) {
      loggedMissingUrl = true;
      console.log("GHL_INBOUND_WEBHOOK_URL not set, skipping GHL sync");
    }
    return { ok: true, skipped: true };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizeGhlPayload(payload)),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    return { ok: true };
  } catch (error) {
    console.error("GHL inbound webhook sync failed:", error);
    return { ok: false };
  }
}
