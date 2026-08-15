import React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  email?: string
  company?: string
  projectType?: string
  goals?: string
  audience?: string
  deliverables?: string
  referencesLinks?: string
  budget?: string
  timeline?: string
  extra?: string
  sessionId?: string
}

const Row = ({ label, value }: { label: string; value?: string | undefined }) => (
  <Text style={row}>
    <strong>{label}:</strong> {value && value.trim() ? value : '—'}
  </Text>
)

const Email = (props: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Project brief from {props.name || 'a client'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={kicker}>POST-PURCHASE INTAKE</Text>
        <Heading style={heading}>Project brief</Heading>
        <Row label="Name" value={props.name} />
        <Row label="Email" value={props.email} />
        <Row label="Company" value={props.company} />
        <Row label="Project type" value={props.projectType} />
        <Hr style={hr} />
        <Row label="Goals" value={props.goals} />
        <Row label="Audience" value={props.audience} />
        <Row label="Deliverables" value={props.deliverables} />
        <Row label="References" value={props.referencesLinks} />
        <Hr style={hr} />
        <Row label="Budget" value={props.budget} />
        <Row label="Timeline" value={props.timeline} />
        <Row label="Anything else" value={props.extra} />
        <Row label="Checkout reference" value={props.sessionId} />
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `Project brief — ${data['name'] || 'new client'}`,
  displayName: 'Project brief intake',
  previewData: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    company: 'Northwind',
    projectType: 'Website / UI-UX',
    goals: 'Relaunch the marketing site before Q4.',
    audience: 'Enterprise ops teams',
    deliverables: 'Design system, 6 pages, build',
    referencesLinks: 'https://linear.app',
    budget: '$5,000 – $10,000',
    timeline: '4–6 weeks',
    extra: 'Copy is mostly written.',
    sessionId: 'cs_test_123',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '600px' }
const kicker = { fontSize: '11px', letterSpacing: '2px', color: '#FF3333', margin: '0 0 8px' }
const heading = { fontSize: '24px', margin: '0 0 16px', color: '#111111' }
const row = { fontSize: '14px', lineHeight: '22px', color: '#333333', margin: '0 0 6px' }
const hr = { borderColor: '#e5e7eb', margin: '18px 0' }
