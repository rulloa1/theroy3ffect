import React from "react";
import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  clientName?: string;
  projectTitle?: string;
  stageTitle?: string;
  reviewNote?: string;
  approvalUrl?: string;
}

const Email = ({
  clientName = "there",
  projectTitle = "your project",
  stageTitle = "A project stage",
  reviewNote = "",
  approvalUrl = "https://www.theroyeffect.com/portal",
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{stageTitle} is ready for your review</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={kicker}>THE ROY EFFECT · CLIENT REVIEW</Text>
        <Heading style={heading}>{stageTitle} is ready</Heading>
        <Text style={text}>Hi {clientName} — I&apos;ve added the latest {stageTitle.toLowerCase()} work for {projectTitle} to your private dashboard.</Text>
        {reviewNote ? <Text style={text}>{reviewNote}</Text> : null}
        <Text style={text}>Review the work, then approve it with one click or send me a specific change request.</Text>
        <Link href={approvalUrl} style={button}>REVIEW &amp; SIGN OFF</Link>
        <Hr style={hr} />
        <Text style={footer}>Rory Ulloa — Creative Director · rory@theroyeffect.com</Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => `${data?.["stageTitle"] ?? "Project stage"} is ready for review`,
  displayName: "Project stage ready for review",
} satisfies TemplateEntry;

const main = { backgroundColor: "#0a0a0a", fontFamily: "Helvetica, Arial, sans-serif" };
const container = { margin: "0 auto", maxWidth: "560px", padding: "36px 30px", backgroundColor: "#16130f", border: "1px solid rgba(239,232,216,.14)", borderTop: "2px solid #dfba73" };
const kicker = { color: "#dfba73", fontSize: "10px", letterSpacing: "2px", margin: "0" };
const heading = { color: "#efe8d8", fontSize: "28px", lineHeight: "34px", margin: "12px 0 18px" };
const text = { color: "#c9c0ad", fontSize: "15px", lineHeight: "24px" };
const button = { display: "inline-block", marginTop: "10px", padding: "13px 18px", backgroundColor: "#dfba73", color: "#0a0a0a", fontSize: "12px", fontWeight: "bold" as const, letterSpacing: "1px", textDecoration: "none" };
const hr = { borderColor: "rgba(239,232,216,.14)", margin: "28px 0 18px" };
const footer = { color: "#857c6c", fontSize: "12px" };

export default Email;