import React from 'react'
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
} from '@react-email/components'

interface Props {
  productName?: string
  amountLabel?: string
  customerEmail?: string
  customerName?: string
  kind?: string
  environment?: string
}

const Email = ({
  productName,
  amountLabel,
  customerEmail,
  customerName,
  kind,
  environment,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New payment: {productName ?? 'commission'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={kicker}>THE ROY EFFECT — PAYMENT</Text>
        <Heading style={heading}>{amountLabel ?? ''} received</Heading>
        <Section>
          <Text style={meta}><strong>Product:</strong> {productName ?? '—'}</Text>
          <Text style={meta}><strong>Type:</strong> {kind ?? 'one-time'}</Text>
          <Text style={meta}><strong>Client:</strong> {customerName || '—'}</Text>
          <Text style={meta}><strong>Email:</strong> {customerEmail ?? '—'}</Text>
          {environment && environment !== 'live' ? (
            <Text style={meta}><strong>Environment:</strong> {environment} (test)</Text>
          ) : null}
        </Section>
        <Hr style={hr} />
        <Text style={footer}>Logged automatically from theroyeffect.com checkout.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `New payment — ${data['productName'] ?? 'commission'} (${data['amountLabel'] ?? ''})`,
  displayName: 'Order notification',
  previewData: {
    productName: 'Website / UI-UX — 50% Deposit',
    amountLabel: '$2,500.00',
    customerEmail: 'jane@example.com',
    customerName: 'Jane Doe',
    kind: 'one-time',
    environment: 'sandbox',
  },
}

const main = { backgroundColor: '#f5f5f5', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '32px', maxWidth: '560px' }
const kicker = { fontSize: '11px', letterSpacing: '2px', color: '#FF3333', margin: '0 0 8px' }
const heading = { fontSize: '24px', margin: '0 0 16px', color: '#111111' }
const meta = { fontSize: '13px', lineHeight: '20px', color: '#333333', margin: '4px 0' }
const hr = { borderColor: '#eeeeee', margin: '24px 0' }
const footer = { fontSize: '11px', color: '#999999' }
