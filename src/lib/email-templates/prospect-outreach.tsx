import React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  businessName?: string;
  body?: string;
  reportUrl?: string;
  topIssue?: string | null;
}

const main = { backgroundColor: "#ffffff", fontFamily: "Helvetica, Arial, sans-serif" };
const container = { padding: "28px 24px", maxWidth: "560px" };
const text = { fontSize: "15px", lineHeight: "24px", color: "#111111", margin: "0 0 14px" };
const button = {
  backgroundColor: "#0B0F1A",
  color: "#C8FF3D",
  borderRadius: "6px",
  padding: "12px 22px",
  fontSize: "15px",
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-block",
};
const small = { fontSize: "12px", lineHeight: "18px", color: "#666666", margin: "0" };

const Email = ({ businessName, body, reportUrl, topIssue }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      {topIssue ? `${topIssue} — a free site report for ${businessName ?? "your business"}` : "A free site report"}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        {(body ?? "").split(/\n{2,}/).map((paragraph, index) => (
          <Text key={index} style={text}>
            {paragraph}
          </Text>
        ))}
        {reportUrl ? (
          <Section style={{ margin: "22px 0" }}>
            <Button href={reportUrl} style={button}>
              See the free report
            </Button>
          </Section>
        ) : null}
        <Text style={text}>
          Rory Ulloa
          <br />
          The Roy Effect · Houston, TX
        </Text>
        <Hr style={{ borderColor: "#eeeeee", margin: "20px 0" }} />
        <Text style={small}>
          theroyeffect.com · rory@theroyeffect.com · (281) 323-0450
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => (data["subject"] as string) ?? "A quick note about your website",
  displayName: "Prospect outreach",
  previewData: {
    businessName: "Bayou City Roofing",
    subject: "Your site is not secure on phones",
    body: "I checked Bayou City Roofing's site this morning. It loads without HTTPS, so Chrome shows a 'Not secure' warning before anyone reads a word.\n\nFor a roofer competing on trust, that warning turns away the exact homeowner who was ready to call.\n\nI put together a short report on what I found and what I would fix first. No charge, nothing to sign up for.",
    reportUrl: "https://www.theroyeffect.com/site-report/example",
    topIssue: "Not secure (no HTTPS)",
  },
} satisfies TemplateEntry;
