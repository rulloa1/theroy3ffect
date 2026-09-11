import React from "react";
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  name?: string;
  email?: string;
  phone?: string;
  projectType?: string;
  message?: string;
  websiteUrl?: string;
  bottleneck?: string;
  notes?: string;
  submittedAt?: string;
}

export function hostFromUrl(url?: string): string {
  if (!url) return "";
  return url
    .trim()
    .replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "");
}

function normalizedHref(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function formatSubmitted(iso?: string): string {
  const date = iso ? new Date(iso) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  const [datePart, timePart] = formatted.split(" at ");
  return timePart ? `${datePart} · ${timePart} CT` : `${formatted} CT`;
}

const GHL_URL =
  "https://app.gohighlevel.com/v2/location/twm3WtydRK7kAdjdYAVJ/contacts/smart_list/All";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Row style={fieldRow}>
    <Column style={labelCell}>{label}</Column>
    <Column style={valueCell}>{children}</Column>
  </Row>
);

const Email = ({
  name,
  email,
  phone,
  projectType,
  message,
  websiteUrl,
  bottleneck,
  notes,
  submittedAt,
}: Props) => {
  const isAudit = Boolean(websiteUrl);
  const host = hostFromUrl(websiteUrl);
  const displayName = name || "A visitor";
  const firstName = displayName.split(" ")[0] || "them";
  const body = (isAudit ? notes : message) || "";
  const summary = isAudit
    ? `${displayName} wants a 5-Minute Website Audit of ${host}`
    : `${displayName} sent a ${projectType || "website"} brief`;

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {`${projectType || "New lead"} from ${displayName}${bottleneck ? ` — ${bottleneck}` : ""}`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>THE ROY EFFECT · NEW LEAD</Text>
          <Heading style={heading}>{isAudit ? "Audit request" : "New brief"}</Heading>
          <Text style={summaryText}>{summary}</Text>

          <Section style={table}>
            <Field label="Name">{displayName}</Field>
            <Field label="Email">
              {email ? (
                <Link href={`mailto:${email}`} style={link}>
                  {email}
                </Link>
              ) : (
                "—"
              )}
            </Field>
            {phone ? <Field label="Phone">{phone}</Field> : null}
            {websiteUrl ? (
              <Field label="Website">
                <Link href={normalizedHref(websiteUrl)} style={link}>
                  {host || websiteUrl}
                </Link>
              </Field>
            ) : null}
            {bottleneck ? <Field label="Primary bottleneck">{bottleneck}</Field> : null}
            <Field label="Project type">{projectType || "—"}</Field>
            <Field label="Submitted">{formatSubmitted(submittedAt)}</Field>
          </Section>

          <Section style={notesBlock}>
            <Text style={notesLabel}>{isAudit ? "NOTES" : "MESSAGE"}</Text>
            <Text style={body ? notesText : notesEmpty}>{body || "No notes provided"}</Text>
          </Section>

          <Section style={{ marginTop: "24px" }}>
            <Button
              href={`mailto:${email || ""}?subject=${encodeURIComponent(
                isAudit ? "Re: your website audit — The Roy Effect" : "Re: your brief",
              )}`}
              style={primaryButton}
            >
              {`Reply to ${firstName}`}
            </Button>
            {isAudit ? (
              <Button href={normalizedHref(websiteUrl!)} style={secondaryButton}>
                {`Open ${host}`}
              </Button>
            ) : null}
            <Text style={{ textAlign: "center" as const, margin: "16px 0 0" }}>
              <Link href={GHL_URL} style={tertiaryLink}>
                Open in GoHighLevel
              </Link>
            </Text>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            Sent by theroyeffect.com · reply-to is set to the lead&apos;s address
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => {
    const name = data["name"] || "website form";
    const host = hostFromUrl(data["websiteUrl"]);
    return host
      ? `Audit request — ${name} · ${host}`
      : `New brief — ${name} · ${data["projectType"] || "website form"}`;
  },
  displayName: "New lead notification",
  previewData: {
    name: "Marta Reyes",
    email: "marta@mcdesign.bio",
    phone: "(281) 323-0450",
    projectType: "5-Minute Website Audit",
    websiteUrl: "https://www.mcdesign.bio",
    bottleneck: "Conversion Rate & Inbound Leads",
    notes: "Please look at our services page.\nOur main competitor is studioX.com.",
    submittedAt: "2026-09-11T14:27:00.000Z",
  },
} satisfies TemplateEntry;

const main = {
  backgroundColor: "#0a0a0a",
  fontFamily: "Helvetica, Arial, sans-serif",
  margin: "0",
  padding: "24px 0",
};
const container = {
  backgroundColor: "#111111",
  margin: "0 auto",
  padding: "32px 24px",
  maxWidth: "560px",
  width: "100%",
  borderTop: "2px solid #dfba73",
  border: "1px solid rgba(255,255,255,0.08)",
};
const eyebrow = {
  fontSize: "11px",
  letterSpacing: "2px",
  color: "#dfba73",
  textTransform: "uppercase" as const,
  margin: "0 0 10px",
  fontWeight: "bold",
};
const heading = {
  fontSize: "26px",
  lineHeight: "30px",
  margin: "0 0 8px",
  color: "#ffffff",
  fontWeight: "bold",
};
const summaryText = { fontSize: "14px", lineHeight: "22px", color: "#d1d5db", margin: "0 0 24px" };
const table = { width: "100%", borderTop: "1px solid rgba(255,255,255,0.08)" };
const fieldRow = { borderBottom: "1px solid rgba(255,255,255,0.08)" };
const labelCell = {
  fontSize: "11px",
  letterSpacing: "1px",
  textTransform: "uppercase" as const,
  color: "#9ca3af",
  padding: "12px 12px 12px 0",
  width: "38%",
  verticalAlign: "top" as const,
};
const valueCell = {
  fontSize: "15px",
  lineHeight: "22px",
  color: "#ffffff",
  padding: "12px 0",
  verticalAlign: "top" as const,
};
const notesBlock = { marginTop: "24px" };
const notesLabel = {
  fontSize: "11px",
  letterSpacing: "1px",
  color: "#9ca3af",
  margin: "0 0 6px",
};
const notesText = {
  fontSize: "15px",
  lineHeight: "23px",
  color: "#ffffff",
  whiteSpace: "pre-wrap" as const,
  margin: "0",
};
const notesEmpty = { fontSize: "14px", color: "#9ca3af", margin: "0", fontStyle: "italic" as const };
const primaryButton = {
  display: "block",
  width: "100%",
  backgroundColor: "#dfba73",
  color: "#111111",
  fontSize: "14px",
  fontWeight: "bold",
  textAlign: "center" as const,
  padding: "13px 0",
  lineHeight: "18px",
  textDecoration: "none",
  boxSizing: "border-box" as const,
};
const secondaryButton = {
  display: "block",
  width: "100%",
  border: "1px solid #dfba73",
  color: "#dfba73",
  fontSize: "14px",
  fontWeight: "bold",
  textAlign: "center" as const,
  padding: "12px 0",
  lineHeight: "18px",
  marginTop: "12px",
  textDecoration: "none",
  boxSizing: "border-box" as const,
};
const tertiaryLink = { color: "#9ca3af", fontSize: "13px", textDecoration: "underline" };
const link = { color: "#dfba73", textDecoration: "underline" };
const hr = { borderColor: "rgba(255,255,255,0.08)", margin: "28px 0 16px" };
const footer = { fontSize: "11px", color: "#9ca3af", margin: "0" };
