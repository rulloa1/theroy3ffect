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
  spoken?: string;
  time_zone?: string;
  notes?: string;
  questionnaire_url?: string;
}

const Email = ({
  spoken = "your selected time",
  time_zone = "America/Chicago",
  notes,
  questionnaire_url = "https://www.theroyeffect.com/brief",
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your discovery call is booked for {spoken}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={kicker}>THE ROY EFFECT</Text>
        <Heading style={headingStyle}>Your discovery call is booked</Heading>
        <Text style={text}>
          You&apos;re set for a 15-minute discovery call on <strong>{spoken}</strong> ({time_zone}).
          I&apos;ll call you at the scheduled time.
        </Text>
        {notes ? <Text style={text}>Noted: {notes}</Text> : null}
        <Text style={text}>
          Please complete the short intake so I can prepare:
        </Text>
        <Text style={text}>
          <Link href={questionnaire_url} style={link}>
            Complete your intake
          </Link>
        </Text>
        <Hr style={hr} />
        <Text style={footer}>Rory Ulloa — Creative Director, theroyeffect.com</Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: () => "Your discovery call is booked",
  displayName: "Booking confirmation",
  previewData: {
    spoken: "Monday, January 1 at 10:00 AM",
    time_zone: "America/Chicago",
    notes: "Looking to redesign our homepage and improve conversions.",
    questionnaire_url: "https://www.theroyeffect.com/brief",
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
const link = { color: "#FF3333", textDecoration: "underline", fontWeight: "bold" };
const footer = { fontSize: "11px", color: "#9ca3af" };
