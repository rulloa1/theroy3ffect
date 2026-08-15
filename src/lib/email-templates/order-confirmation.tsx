import React from 'react'
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
} from '@react-email/components'

interface Props {
  productName?: string
  amountLabel?: string
  briefUrl?: string
  recurring?: boolean
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
          Thanks — your payment for <strong>{productName ?? 'your commission'}</strong>
          {amountLabel ? ` (${amountLabel})` : ''} came through
          {recurring ? ' and your retainer is now active.' : '.'}
        </Text>
        <Text style={text}>
          Next step: send me your project brief so I can lock in scope and a start date.
          I&apos;ll reply personally within one business day.
        </Text>
        <Section style={{ marginTop: '24px' }}>
          <Button style={button} href={briefUrl ?? 'https://www.theroyeffect.com/#contact'}>
            Send your project brief
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={meta}>
          Deposits are credited against your final invoice and are refundable before kickoff.
          {recurring ? ' Retainers can be paused or cancelled anytime.' : ''}
        </Text>
        <Text style={footer}>Rory Ulloa — Creative Director, theroyeffect.com</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Payment received — The Roy Effect',
  displayName: 'Order confirmation',
  previewData: {
    productName: 'Website / UI-UX — 50% Deposit',
    amountLabel: '$2,500.00',
    briefUrl: 'https://www.theroyeffect.com/#contact',
  },
}

const main = { backgroundColor: '#f5f5f5', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '32px', maxWidth: '560px' }
const kicker = { fontSize: '11px', letterSpacing: '2px', color: '#FF3333', margin: '0 0 8px' }
const heading = { fontSize: '26px', margin: '0 0 16px', color: '#111111' }
const text = { fontSize: '14px', lineHeight: '22px', color: '#333333' }
const meta = { fontSize: '12px', lineHeight: '20px', color: '#666666' }
const hr = { borderColor: '#eeeeee', margin: '24px 0' }
const button = {
  backgroundColor: '#FF3333',
  color: '#ffffff',
  fontSize: '13px',
  letterSpacing: '1px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '11px', color: '#999999', marginTop: '16px' }
