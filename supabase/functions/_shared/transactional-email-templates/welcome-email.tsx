/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const LOGO_URL = 'https://tqqkzeblmjapgbnsbtgw.supabase.co/storage/v1/object/public/email-assets/botvio-logo.png'
const SITE_NAME = 'Botvio'

interface WelcomeEmailProps {
  name?: string
}

const WelcomeEmail = ({ name }: WelcomeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to Botvio — your AI trading companion</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="Botvio" width="120" height="40" style={logo} />
        <Heading style={h1}>
          {name ? `Welcome aboard, ${name}! 🚀` : 'Welcome aboard! 🚀'}
        </Heading>
        <Text style={text}>
          You've joined thousands of traders using Botvio for AI-powered signals,
          chart analysis, and Gold trading insights.
        </Text>
        <Text style={text}>Here's what you can do next:</Text>
        <Text style={text}>
          📊 Explore AI trading signals{'\n'}
          🤖 Set up automated bots{'\n'}
          💰 Access Gold & Forex analysis{'\n'}
          📈 Upload charts for AI analysis
        </Text>
        <Button style={button} href="https://botvio.live">
          Start Trading
        </Button>
        <Text style={footer}>
          Need help? Reply to this email or check our docs at botvio.live/docs.
        </Text>
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: 'Welcome to Botvio — let\'s start trading!',
  displayName: 'Welcome email',
  previewData: { name: 'Trader' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '30px 25px' }
const logo = { margin: '0 0 24px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#0D1117',
  margin: '0 0 16px',
}
const text = {
  fontSize: '15px',
  color: '#808899',
  lineHeight: '1.6',
  margin: '0 0 20px',
  whiteSpace: 'pre-line' as const,
}
const button = {
  backgroundColor: '#D4940A',
  color: '#0D1117',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '8px',
  padding: '14px 28px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#808899', margin: '20px 0 0' }
