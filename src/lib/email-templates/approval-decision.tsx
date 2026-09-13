import React from "react";
import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  clientEmail?: string;
  projectTitle?: string;
  stageTitle?: string;
  decision?: "approved" | "changes_requested";
  feedback?: string;
  adminUrl?: string;
}

const Email = ({ clientEmail = "A client", projectTitle = "Project", stageTitle = "Stage", decision = "approved", feedback = "", adminUrl = "https://www.theroyeffect.com/admin" }: Props) => {
  const approved = decision === "approved";
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{stageTitle}: {approved ? "approved" : "changes requested"}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={kicker}>THE ROY EFFECT · CLIENT DECISION</Text>
          <Heading style={heading}>{approved ? "Stage approved" : "Changes requested"}</Heading>
          <Text style={text}><strong>{stageTitle}</strong> for {projectTitle} was {approved ? "approved" : "returned with changes"} by {clientEmail}.</Text>
          {feedback ? <Text style={feedbackStyle}>{feedback}</Text> : null}
          <Link href={adminUrl} style={button}>OPEN CLIENT PORTAL ADMIN</Link>
          <Hr style={hr} />
          <Text style={footer}>Automated project approval notification</Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => `${data?.["stageTitle"] ?? "Project stage"}: ${data?.["decision"] === "changes_requested" ? "changes requested" : "approved"}`,
  displayName: "Project approval decision",
  to: "rory@theroyeffect.com",
} satisfies TemplateEntry;

const main = { backgroundColor: "#0a0a0a", fontFamily: "Helvetica, Arial, sans-serif" };
const container = { margin: "0 auto", maxWidth: "560px", padding: "36px 30px", backgroundColor: "#16130f", border: "1px solid rgba(239,232,216,.14)", borderTop: "2px solid #dfba73" };
const kicker = { color: "#dfba73", fontSize: "10px", letterSpacing: "2px", margin: "0" };
const heading = { color: "#efe8d8", fontSize: "28px", margin: "12px 0 18px" };
const text = { color: "#c9c0ad", fontSize: "15px", lineHeight: "24px" };
const feedbackStyle = { color: "#efe8d8", fontSize: "15px", lineHeight: "24px", padding: "14px", borderLeft: "2px solid #c8362b", backgroundColor: "#1f1a14" };
const button = { display: "inline-block", marginTop: "10px", color: "#dfba73", fontSize: "12px", fontWeight: "bold" as const, letterSpacing: "1px" };
const hr = { borderColor: "rgba(239,232,216,.14)", margin: "28px 0 18px" };
const footer = { color: "#857c6c", fontSize: "12px" };

export default Email;