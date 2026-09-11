import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { hostFromUrl } from "./brief-notification";

interface Props {
  name?: string;
  projectType?: string;
  message?: string;
  pdfUrl?: string;
  websiteUrl?: string;
  notes?: string;
}

const Email = ({ name, projectType, message, pdfUrl, websiteUrl, notes }: Props) => {
  const isAudit = Boolean(websiteUrl);
  const host = hostFromUrl(websiteUrl);
  const body = (isAudit ? notes : message) || "";

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {isAudit
          ? "Audit request received — your teardown is on the way."
          : "Brief received — Rory will be in touch shortly."}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>THE ROY EFFECT</Text>
          <Heading style={heading}>{isAudit ? "Audit request received" : "Brief received"}</Heading>
          <Text style={text}>
            {name ? `Hi ${name},` : "Hi there,"}{" "}
            {isAudit
              ? `Got it — I'll record your 5-minute audit of ${host} and send it to this address within 2 business days.`
              : "thanks for reaching out. Your brief landed safely and I'll get back to you personally within one business day."}
          </Text>
          <Hr style={hr} />
          <Section>
            {projectType ? (
              <Text style={meta}>
                <strong>Project type:</strong> {projectType}
              </Text>
            ) : null}
            {websiteUrl ? (
              <Text style={meta}>
                <strong>Website:</strong> {host}
              </Text>
            ) : null}
            {body ? (
              <Text style={meta}>
                <strong>{isAudit ? "Your notes:" : "Your message:"}</strong>
              </Text>
            ) : null}
            {body ? <Text style={preWrap}>{body}</Text> : null}
          </Section>
          {pdfUrl ? (
            <Section>
              <Text style={meta}>
                A PDF summary of your brief is attached as a secure link:{" "}
                <Link href={pdfUrl} style={link}>
                  Download your brief (PDF)
                </Link>
              </Text>
            </Section>
          ) : null}
          <Hr style={hr} />
          <Text style={footer}>Rory Ulloa — Creative Director, theroyeffect.com</Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    data["websiteUrl"]
      ? "Got your audit request — The Roy Effect"
      : "Got your brief — The Roy Effect",
  displayName: "Lead confirmation",
  previewData: {
    name: "Marta",
    projectType: "5-Minute Website Audit",
    websiteUrl: "https://www.mcdesign.bio",
    notes: "Please look at our services page.\nOur main competitor is studioX.com.",
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
  border: "1px solid rgba(255,255,255,0.08)",
  borderTop: "2px solid #dfba73",
};
const eyebrow = {
  fontSize: "11px",
  letterSpacing: "3px",
  color: "#dfba73",
  margin: "0 0 8px",
  fontWeight: "bold",
};
const heading = { fontSize: "26px", margin: "0 0 16px", color: "#ffffff", fontWeight: "bold" };
const text = { fontSize: "14px", lineHeight: "22px", color: "#e5e7eb" };
const meta = { fontSize: "13px", lineHeight: "22px", color: "#9ca3af", margin: "0 0 8px" };
const preWrap = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#ffffff",
  whiteSpace: "pre-wrap" as const,
  margin: "0 0 8px",
};
const hr = { borderColor: "rgba(255,255,255,0.08)", margin: "24px 0" };
const link = { color: "#dfba73", textDecoration: "underline", fontWeight: "bold" };
const footer = { fontSize: "11px", color: "#9ca3af" };
