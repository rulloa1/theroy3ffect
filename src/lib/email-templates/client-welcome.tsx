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
  clientName?: string;
  productName?: string;
  amountLabel?: string;
  nextStep?: string;
  milestones?: string[];
  portalUrl?: string;
  briefUrl?: string;
}

const Email = ({
  clientName = "there",
  productName = "your project",
  amountLabel = "",
  nextStep = "",
  milestones = [],
  portalUrl = "https://www.theroyeffect.com/portal",
  briefUrl = "https://www.theroyeffect.com/brief",
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your project is set up — here is what happens next</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={kicker}>THE ROY EFFECT</Text>
        <Heading style={headingStyle}>Your project is set up</Heading>

        <Text style={text}>
          {clientName}, thanks for your payment{amountLabel ? ` of ${amountLabel}` : ""} for{" "}
          {productName}. I&apos;ve created your project in the client portal, so you can follow
          every step from one place.
        </Text>

        {nextStep ? (
          <Text style={text}>
            <strong style={strong}>Your next step:</strong> {nextStep}
          </Text>
        ) : null}

        {milestones.length ? (
          <>
            <Text style={label}>THE PLAN</Text>
            {milestones.map((title, index) => (
              <Text key={title} style={item}>
                {String(index + 1).padStart(2, "0")} — {title}
              </Text>
            ))}
          </>
        ) : null}

        <Text style={text}>
          <Link href={portalUrl} style={link}>
            Open your client portal
          </Link>
          {"  ·  "}
          <Link href={briefUrl} style={link}>
            Send me your brief
          </Link>
        </Text>

        <Text style={text}>
          You approve the design before anything is built, and the design you approve is what goes
          live. Reply to this email any time.
        </Text>

        <Hr style={hr} />
        <Text style={footer}>
          Rory Ulloa — Creative Director, theroyeffect.com · rory@theroyeffect.com · (281) 323-0450
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `Your project is set up — ${data?.["productName"] ?? "The Roy Effect"}`,
  displayName: "Client welcome & kickoff",
  previewData: {
    clientName: "Marta",
    productName: "Signature Website",
    amountLabel: "$2,500.00",
    nextStep: "Fill in the project brief so I can start on direction.",
    milestones: ["Brief received", "Design direction", "Design sign-off", "Build", "Launch"],
    portalUrl: "https://www.theroyeffect.com/portal",
    briefUrl: "https://www.theroyeffect.com/brief",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#05050a", fontFamily: "Helvetica, Arial, sans-serif" };
const container = {
  backgroundColor: "#0a0a12",
  margin: "0 auto",
  padding: "36px 32px",
  maxWidth: "560px",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderTop: "2px solid #dfba73",
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
const strong = { color: "#ffffff" };
const label = {
  fontSize: "10px",
  letterSpacing: "2px",
  color: "#9ca3af",
  margin: "20px 0 6px",
  fontWeight: "bold",
};
const item = { fontSize: "13px", lineHeight: "20px", color: "#e5e7eb", margin: "0 0 4px" };
const hr = { borderColor: "rgba(255, 255, 255, 0.1)", margin: "24px 0" };
const link = { color: "#E51924", textDecoration: "underline", fontWeight: "bold" };
const footer = { fontSize: "11px", color: "#9ca3af" };
