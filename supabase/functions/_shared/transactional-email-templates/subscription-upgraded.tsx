/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const LOGO_URL = 'https://tqqkzeblmjapgbnsbtgw.supabase.co/storage/v1/object/public/email-assets/botvio-logo.png'
const SITE_NAME = 'Botvio – Forex Signals, AI Chart Analysis & Gold Trading Mentorship'

interface SubscriptionUpgradedProps {
  name?: string
  planName?: string
}

const SubscriptionUpgradedEmail = ({ name, planName }: SubscriptionUpgradedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {SITE_NAME} plan has been upgraded{planName ? ` to ${planName}` : ''}!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="Botvio" width="120" height="40" style={logo} />

        <Heading style={h1}>
          {name ? `Congrats, ${name}! 🎉` : 'Congrats! 🎉'}
        </Heading>

        <Text style={text}>
          Your subscription has been upgraded{planName ? ` to **${planName}**` : ''}. You now have access to premium signals, AI chart analysis, copy trading, and more.
        </Text>

        <Button style={button} href="https://botvio.live/dashboard">
          Go to Dashboard
        </Button>

        <Hr style={divider} />

        <Heading style={h2}>🏦 Set Up Your Broker Accounts</Heading>
        <Text style={text}>
          To trade our signals instantly, create accounts with our partner brokers:
        </Text>

        <Section style={brokerSection}>
          <Link
            href="https://track.deriv.com/_a_gq1w0BG0D1hit6RV3zsGNd7ZgqdRLk/1/"
            style={brokerBtnDeriv}
          >
            Open Deriv Account →
          </Link>
        </Section>

        <Section style={brokerSection}>
          <Link
            href="https://one.exness-track.com/a/ts1kvs1k"
            style={brokerBtnExness}
          >
            Open Exness Account →
          </Link>
        </Section>

        <Section style={brokerSection}>
          <Link
            href="https://gowt.net/ib67505"
            style={brokerBtnWeltrade}
          >
            Open Weltrade Account →
          </Link>
        </Section>

        <Hr style={divider} />

        <Heading style={h2}>📺 Join Our Community</Heading>
        <Text style={text}>
          Subscribe to our YouTube channel for daily market breakdowns, live trading, and strategy tutorials.
        </Text>
        <Link href="https://youtube.com/@Forexsmartmoneyconcept" style={ytLink}>
          ▶ YouTube — @Forexsmartmoneyconcept
        </Link>

        <Text style={footer}>
          Need help? Email us at info@botvio.live or WhatsApp +260966284085.
        </Text>
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SubscriptionUpgradedEmail,
  subject: (data: Record<string, any>) =>
    data.planName
      ? `You're now on ${data.planName} — welcome aboard!`
      : 'Your subscription has been upgraded!',
  displayName: 'Subscription upgraded',
  previewData: { name: 'Trader', planName: 'VIP' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '30px 25px' }
const logo = { margin: '0 0 24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0D1117', margin: '0 0 16px' }
const h2 = { fontSize: '17px', fontWeight: 'bold' as const, color: '#0D1117', margin: '24px 0 8px' }
const text = { fontSize: '15px', color: '#808899', lineHeight: '1.6', margin: '0 0 20px' }
const button = {
  backgroundColor: '#D4940A',
  color: '#0D1117',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '8px',
  padding: '14px 28px',
  textDecoration: 'none',
}
const divider = { borderColor: '#eaeaea', margin: '28px 0' }
const brokerSection = { margin: '8px 0' }
const brokerBtnDeriv = {
  display: 'inline-block' as const,
  backgroundColor: '#ff444f',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  borderRadius: '6px',
  padding: '10px 20px',
  textDecoration: 'none',
}
const brokerBtnExness = {
  display: 'inline-block' as const,
  backgroundColor: '#FFCF01',
  color: '#0D1117',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  borderRadius: '6px',
  padding: '10px 20px',
  textDecoration: 'none',
}
const brokerBtnWeltrade = {
  display: 'inline-block' as const,
  backgroundColor: '#00A859',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  borderRadius: '6px',
  padding: '10px 20px',
  textDecoration: 'none',
}
const ytLink = {
  display: 'inline-block' as const,
  fontSize: '14px',
  color: '#D4940A',
  fontWeight: 'bold' as const,
  textDecoration: 'underline',
  margin: '0 0 20px',
}
const footer = { fontSize: '12px', color: '#808899', margin: '20px 0 0' }
