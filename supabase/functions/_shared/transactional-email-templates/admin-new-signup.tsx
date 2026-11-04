/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface AdminNewSignupProps {
  newUserEmail: string
  newUserId: string
  signupDate: string
}

const AdminNewSignup = ({ newUserEmail, newUserId, signupDate }: AdminNewSignupProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New Botvio account registration</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>New Botvio signup</Heading>
        <Text style={text}>A new user account has been created on Botvio.</Text>
        <Text style={text}><strong>Email:</strong> {newUserEmail}</Text>
        <Text style={text}><strong>User ID:</strong> {newUserId}</Text>
        <Text style={text}><strong>Registered:</strong> {signupDate}</Text>
        <Text style={note}>This alert does not mean the user's email is confirmed or a broker account is attributed.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AdminNewSignup,
  subject: (data: Record<string, any>) => `New Botvio signup: ${data.newUserEmail || 'new user'}`,
  to: 'sifotech@gmail.com',
  displayName: 'Admin new signup alert',
  previewData: { newUserEmail: 'new-user@example.com', newUserId: 'user-id', signupDate: 'Nov 4, 2026' },
} satisfies TemplateEntry

const main = { backgroundColor: '#0D1117', fontFamily: 'Arial, sans-serif' }
const container = { padding: '28px 24px', maxWidth: '600px', margin: '0 auto' }
const heading = { color: '#E8B323', fontSize: '24px', fontWeight: 'bold' as const }
const text = { color: '#E5E7EB', fontSize: '14px', lineHeight: '1.6' }
const note = { color: '#9CA3AF', fontSize: '12px', lineHeight: '1.5', marginTop: '24px' }
