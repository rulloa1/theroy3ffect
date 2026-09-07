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
  client_name?: string;
  project_title?: string;
  timeline_weeks?: string;
  total_price?: string;
  deposit_price?: string;
  proposal_url?: string;
  portal_url?: string;
}

const Email = ({
  client_name = "there",
  project_title = "Your project",
  timeline_weeks = "2–3 Weeks",
  total_price = "$5,000",
  deposit_price = "$2,500",
  proposal_url = "https://www.theroyeffect.com/portal",
  portal_url = "https://www.theroyeffect.com/portal",
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your proposal for {project_title} is ready to review</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={kicker}>THE ROY EFFECT</Text>
        <Heading style={headingStyle}>Your proposal is ready</Heading>
        <Text style={text}>
          Hi {client_name} — here&apos;s the scope agreement for <strong>{project_title}</strong>.
        </Text>
        <Text style={text}>
          Timeline: {timeline_weeks}
          <br />
          Total: {total_price} · Deposit to start: {deposit_price}
        </Text>
        <Text style={text}>
          <Link href={proposal_url} style={link}>
            Review &amp; sign your proposal
          </Link>
        </Text>
        <Text style={text}>
          You can also find it any time in your{" "}
          <Link href={portal_url} style={link}>
            client dashboard
          </Link>
          .
        </Text>
        <Hr style={hr} />
        <Text style={footer}>Rory Ulloa — Creative Director, theroyeffect.com</Text>
      </Container>
    </Body>
  </Html>
);

const main = { backgroundColor: "#050505", fontFamily: "Helvetica, Arial, sans-serif" };
const container = { margin: "0 auto", padding: "32px 24px", maxWidth: "560px" };
const kicker = { color: "#FF3333", fontSize: "11px", letterSpacing: "2px", margin: "0" };
const headingStyle = { color: "#ffffff", fontSize: "26px", margin: "12px 0 20px" };
const text = { color: "#d4d4d4", fontSize: "14px", lineHeight: "22px" };
const link = { color: "#FF3333", fontWeight: "bold" as const };
const hr = { borderColor: "#262626", margin: "24px 0" };
const footer = { color: "#737373", fontSize: "12px" };

export const template: TemplateEntry = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `Your proposal: ${data?.["project_title"] ?? "Project scope agreement"}`,
  displayName: "Proposal ready",
  previewData: {
    client_name: "Marta",
    project_title: "Reyes Roofing — Website Refresh",
    timeline_weeks: "3 Weeks",
    total_price: "$6,500",
    deposit_price: "$3,250",
    proposal_url: "https://www.theroyeffect.com/proposal/example",
    portal_url: "https://www.theroyeffect.com/portal",
  },
};

export default Email;
