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

interface Props {
  name?: string;
  projectType?: string;
  message?: string;
  pdfUrl?: string;
}

const Email = ({ name, projectType, message, pdfUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Brief received — Rory will be in touch shortly.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={kicker}>THE ROY EFFECT</Text>
        <Heading style={heading}>Brief received</Heading>
        <Text style={text}>
          {name ? `Hi ${name},` : "Hi there,"} thanks for reaching out. Your brief landed safely and
          I&apos;ll get back to you personally within one business day.
        </Text>
        <Hr style={hr} />
        <Section>
          {projectType ? (
            <Text style={meta}>
              <strong>Project type:</strong> {projectType}
            </Text>
          ) : null}
          {message ? (
            <Text style={meta}>
              <strong>Your message:</strong> {message}
            </Text>
          ) : null}
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

export const template = {
  component: Email,
  subject: "Brief received — The Roy Effect",
  displayName: "Brief confirmation",
  previewData: {
    name: "Jane",
    projectType: "Website / UI-UX",
    message: "We need a bold rebrand for our launch.",
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
const heading = { fontSize: "28px", margin: "0 0 16px", color: "#ffffff", fontWeight: "bold" };
const text = { fontSize: "14px", lineHeight: "22px", color: "#e5e7eb" };
const meta = { fontSize: "13px", lineHeight: "22px", color: "#9ca3af", margin: "0 0 8px" };
const hr = { borderColor: "rgba(255, 255, 255, 0.1)", margin: "24px 0" };
const link = { color: "#E51924", textDecoration: "underline", fontWeight: "bold" };
const footer = { fontSize: "11px", color: "#9ca3af" };
