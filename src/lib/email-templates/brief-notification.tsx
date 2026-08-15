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
  projectType?: string
  message?: string
}

const Email = ({ name, email, projectType, message }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New brief from {name || 'a visitor'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>New brief</Heading>
        <Text style={row}>
          <strong>Name:</strong> {name || '—'}
        </Text>
        <Text style={row}>
          <strong>Email:</strong> {email || '—'}
        </Text>
        <Text style={row}>
          <strong>Project type:</strong> {projectType || '—'}
        </Text>
        <Hr style={hr} />
        <Text style={row}>{message || 'No details provided.'}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => `New brief — ${data['name'] || 'website form'}`,
  displayName: 'New brief notification',
  previewData: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    projectType: 'Brand identity',
    message: 'Looking for a full identity refresh before Q4.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const heading = { fontSize: '24px', margin: '0 0 16px', color: '#111111' }
const row = { fontSize: '15px', lineHeight: '24px', color: '#333333', margin: '0 0 6px' }
const hr = { borderColor: '#e5e7eb', margin: '20px 0' }
