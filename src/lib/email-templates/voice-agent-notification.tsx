import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  subjectLine?: string;
  details?: Record<string, string | undefined>;
}

const Email = ({ subjectLine = "Voice agent activity", details = {} }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{subjectLine}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={kicker}>THE ROY EFFECT — VOICE CONCIERGE</Text>
        <Heading style={heading}>{subjectLine}</Heading>
        <Hr style={hr} />
        <Section>
          {Object.entries(details)
            .filter(([, value]) => Boolean(value))
            .map(([label, value]) => (
              <Text key={label} style={meta}>
                <strong>{label}:</strong> {value}
              </Text>
            ))}
        </Section>
        <Hr style={hr} />
        <Text style={footer}>Captured automatically by the inbound voice concierge.</Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `[Voice] ${data?.["subjectLine"] ?? "Agent activity"} — The Roy Effect`,
  displayName: "Voice agent notification",
  to: "rory@theroyeffect.com",
  previewData: {
    subjectLine: "New voice lead captured",
    details: { Name: "Jane Doe", Email: "jane@example.com", "Project type": "website_uiux" },
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#05050a", fontFamily: "Helvetica, Arial, sans-serif" };
const container = {
  backgroundColor: "#0a0a12",
  margin: "0 auto",
  padding: "36px 32px",
  maxWidth: "560px",
  border: "1px solid rgba(255, 255, 255, 0.1)",
};
const kicker = {
  fontSize: "11px",
  letterSpacing: "3px",
  color: "#DFBA73",
  margin: "0 0 8px",
  fontWeight: "bold",
};
const heading = { fontSize: "26px", margin: "0 0 16px", color: "#ffffff", fontWeight: "bold" };
const meta = { fontSize: "13px", lineHeight: "22px", color: "#e5e7eb", margin: "0 0 8px" };
const hr = { borderColor: "rgba(255, 255, 255, 0.1)", margin: "24px 0" };
const footer = { fontSize: "11px", color: "#9ca3af" };
