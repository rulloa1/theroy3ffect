import { describe, expect, it } from "vitest";
import { normalizeGhlPayload } from "../inbound-webhook.server";

describe("normalizeGhlPayload", () => {
  it("splits a full name into first and last", () => {
    const out = normalizeGhlPayload({ name: "Marta Reyes", source: "website_contact_form" });
    expect(out["first_name"]).toBe("Marta");
    expect(out["last_name"]).toBe("Reyes");
    expect(out["full_name"]).toBe("Marta Reyes");
  });

  it("handles single names and multi-word last names", () => {
    expect(normalizeGhlPayload({ name: "Madonna", source: "x" })["last_name"]).toBe("");
    const out = normalizeGhlPayload({ name: "Ana Maria De La Cruz", source: "x" });
    expect(out["first_name"]).toBe("Ana");
    expect(out["last_name"]).toBe("Maria De La Cruz");
  });

  it("keeps every key present with empty defaults for missing fields", () => {
    const out = normalizeGhlPayload({ source: "website_brief" });
    for (const key of [
      "first_name",
      "last_name",
      "full_name",
      "email",
      "phone",
      "source",
      "project_type",
      "message",
      "company",
      "budget",
      "timeline",
      "sms_service_consent",
      "sms_marketing_consent",
      "consent_captured_at",
      "page_url",
      "submitted_at",
      "tags",
    ]) {
      expect(out).toHaveProperty(key);
    }
    expect(out["email"]).toBe("");
    expect(out["phone"]).toBe("");
    expect(out["sms_service_consent"]).toBe(false);
    expect(out["tags"]).toBe("");
    expect(out["submitted_at"]).not.toBe(""); // auto-filled timestamp
  });

  it("joins tags into a comma-separated string", () => {
    const out = normalizeGhlPayload({
      source: "website_contact_form",
      tags: ["website-lead", "contact-form"],
    });
    expect(out["tags"]).toBe("website-lead,contact-form");
  });

  it("passes through provided values", () => {
    const out = normalizeGhlPayload({
      name: "Rory Ulloa",
      email: "rory@theroyeffect.com",
      phone: "2813230450",
      source: "website_brief",
      projectType: "Brand Sprint",
      budget: "$5k",
      timeline: "Q4",
      smsServiceConsent: true,
      smsMarketingConsent: false,
      consentCapturedAt: "2026-09-10T00:00:00.000Z",
      pageUrl: "https://theroyeffect.com/brief",
      submittedAt: "2026-09-10T01:00:00.000Z",
    });
    expect(out["email"]).toBe("rory@theroyeffect.com");
    expect(out["phone"]).toBe("2813230450");
    expect(out["project_type"]).toBe("Brand Sprint");
    expect(out["sms_service_consent"]).toBe(true);
    expect(out["sms_marketing_consent"]).toBe(false);
    expect(out["submitted_at"]).toBe("2026-09-10T01:00:00.000Z");
  });
});
