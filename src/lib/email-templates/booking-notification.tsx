import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  name?: string;
  email?: string;
  phone?: string;
  when?: string;
  notes?: string;
}

const Email = ({
  name = "Unknown",
  email = "—",
  phone = "—",
  when = "—",
  notes,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New discovery call booking from {name}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={kicker}>THE ROY EFFECT</Text>
        <Heading style={headingStyle}>New discovery call booking</Heading>
        <Text style={text}>
          <strong>Name:</strong> {name}
          <br />
          <strong>Email:</strong> {email}
          <br />
          <strong>Phone:</strong> {phone}
          <br />
          <strong>When:</strong> {when}
        </Text>
        {notes ? (
          <>
            <Hr style={hr} />
            <Text style={text}>{notes}</Text>
          </>
        ) : null}
        <Hr style={hr} />
        <Text style={footer}>theroyeffect.com/book</Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => `New discovery call booking: ${data?.["name"] ?? "Unknown"}`,
  displayName: "Booking notification",
  to: "rory@theroyeffect.com",
  previewData: {
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "(555) 123-4567",
    when: "Monday, January 1 at 10:00 AM (America/Chicago)",
    notes: "Wants to discuss a brand sprint for a new SaaS product.",
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
  color: "#FF3333",
  margin: "0 0 8px",
  fontWeight: "bold",
};
const headingStyle = { fontSize: "26px", margin: "0 0 16px", color: "#ffffff", fontWeight: "bold" };
const text = { fontSize: "14px", lineHeight: "22px", color: "#e5e7eb" };
const hr = { borderColor: "rgba(255, 255, 255, 0.1)", margin: "24px 0" };
const footer = { fontSize: "11px", color: "#9ca3af" };
