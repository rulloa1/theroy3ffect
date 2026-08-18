import React from "react";
import {
  Body,
  Button,
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
  productName?: string;
  amountLabel?: string;
  briefUrl?: string;
  recurring?: boolean;
}

const Email = ({ productName, amountLabel, briefUrl, recurring }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Payment received — next step: send me your project brief.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={kicker}>THE ROY EFFECT</Text>
        <Heading style={heading}>Payment received</Heading>
        <Text style={text}>
          Thanks — your payment for <strong>{productName ?? "your commission"}</strong>
          {amountLabel ? ` (${amountLabel})` : ""} came through
          {recurring ? " and your retainer is now active." : "."}
        </Text>
        <Text style={text}>
          Next step: send me your project brief so I can lock in scope and a start date. I&apos;ll
          reply personally within one business day.
        </Text>
        <Section style={{ marginTop: "24px" }}>
          <Button style={button} href={briefUrl ?? "https://www.theroyeffect.com/#contact"}>
            Send your project brief
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={meta}>
          Deposits are credited against your final invoice and are refundable before kickoff.
          {recurring ? " Retainers can be paused or cancelled anytime." : ""}
        </Text>
        <Text style={footer}>Rory Ulloa — Creative Director, theroyeffect.com</Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: "Payment received — The Roy Effect",
  displayName: "Order confirmation",
  previewData: {
    productName: "Website / UI-UX — 50% Deposit",
    amountLabel: "$2,500.00",
    briefUrl: "https://www.theroyeffect.com/#contact",
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
const heading = { fontSize: "28px", margin: "0 0 16px", color: "#ffffff", fontWeight: "bold" };
const text = { fontSize: "14px", lineHeight: "22px", color: "#e5e7eb" };
const meta = { fontSize: "12px", lineHeight: "20px", color: "#9ca3af" };
const hr = { borderColor: "rgba(255, 255, 255, 0.1)", margin: "24px 0" };
const button = {
  backgroundColor: "#E51924",
  color: "#ffffff",
  fontSize: "12px",
  letterSpacing: "2px",
  padding: "14px 24px",
  textDecoration: "none",
  fontWeight: "bold",
  display: "inline-block",
};
const footer = { fontSize: "11px", color: "#9ca3af", marginTop: "16px" };
