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

interface Props {
  event?: string;
  productName?: string;
  customerEmail?: string;
  status?: string;
  periodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

const Email = ({
  event,
  productName,
  customerEmail,
  status,
  periodEnd,
  cancelAtPeriodEnd,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Retainer {event ?? "update"}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={kicker}>THE ROY EFFECT — RETAINER</Text>
        <Heading style={heading}>Retainer {event ?? "update"}</Heading>
        <Section>
          <Text style={meta}>
            <strong>Plan:</strong> {productName ?? "—"}
          </Text>
          <Text style={meta}>
            <strong>Client:</strong> {customerEmail ?? "—"}
          </Text>
          <Text style={meta}>
            <strong>Status:</strong> {status ?? "—"}
          </Text>
          {periodEnd ? (
            <Text style={meta}>
              <strong>Current period ends:</strong> {periodEnd}
            </Text>
          ) : null}
          {cancelAtPeriodEnd ? (
            <Text style={meta}>
              <strong>Note:</strong> cancels at period end — access continues until then.
            </Text>
          ) : null}
        </Section>
        <Hr style={hr} />
        <Text style={footer}>Logged automatically from theroyeffect.com checkout.</Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => `Retainer ${data["event"] ?? "update"} — The Roy Effect`,
  displayName: "Retainer notification",
  previewData: {
    event: "started",
    productName: "Design Retainer — Monthly",
    customerEmail: "jane@example.com",
    status: "active",
    periodEnd: "Sep 15, 2026",
  },
};

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
const meta = { fontSize: "13px", lineHeight: "22px", color: "#e5e7eb", margin: "4px 0" };
const hr = { borderColor: "rgba(255, 255, 255, 0.1)", margin: "24px 0" };
const footer = { fontSize: "11px", color: "#9ca3af" };
