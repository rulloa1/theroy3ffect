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
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  heading?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

const Email = ({ heading: title = "The Roy Effect", body, ctaLabel, ctaUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{title}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={kicker}>THE ROY EFFECT</Text>
        <Heading style={headingStyle}>{title}</Heading>
        {body ? <Text style={text}>{body}</Text> : null}
        {ctaLabel && ctaUrl ? (
          <Text style={text}>
            <Link href={ctaUrl} style={link}>
              {ctaLabel}
            </Link>
          </Text>
        ) : null}
        <Hr style={hr} />
        <Text style={footer}>Rory Ulloa — Creative Director, theroyeffect.com</Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => `${data?.["heading"] ?? "The Roy Effect"}`,
  displayName: "Voice agent follow-up",
  previewData: {
    heading: "Your free audit request is in",
    body: "Rory will review your site and send your audit shortly.",
    ctaLabel: "See what the audit covers",
    ctaUrl: "https://www.theroyeffect.com/audit",
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
const headingStyle = { fontSize: "26px", margin: "0 0 16px", color: "#ffffff", fontWeight: "bold" };
const text = { fontSize: "14px", lineHeight: "22px", color: "#e5e7eb" };
const hr = { borderColor: "rgba(255, 255, 255, 0.1)", margin: "24px 0" };
const link = { color: "#E51924", textDecoration: "underline", fontWeight: "bold" };
const footer = { fontSize: "11px", color: "#9ca3af" };
