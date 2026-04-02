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

const LOGO_URL = 'https://tqqkzeblmjapgbnsbtgw.supabase.co/storage/v1/object/public/email-assets/botvio-logo.png'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to Botvio — verify your email</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="Botvio" width="120" height="40" style={logo} />
        <Heading style={h1}>Welcome to Botvio 🚀</Heading>
        <Text style={text}>
          You're one step away from accessing AI-powered trading signals,
          chart analysis, and Gold trading insights.
        </Text>
        <Text style={text}>
          Confirm your email address (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) to get started:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Verify My Email
        </Button>

        <Hr style={divider} />

        <Text style={h2}>📈 Create Your Broker Accounts</Text>
        <Text style={textSmall}>
          To receive and act on our AI signals, we recommend setting up accounts
          with these trusted brokers:
        </Text>

        <Section style={brokerRow}>
          <Button style={brokerBtnDeriv} href="https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804DC&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU23827">
            Open Deriv Account
          </Button>
        </Section>
        <Section style={brokerRow}>
          <Button style={brokerBtnExness} href="https://one.exness-track.com/a/ts1kvs1k">
            Open Exness Account
          </Button>
        </Section>
        <Section style={brokerRow}>
          <Button style={brokerBtnWeltrade} href="https://gowt.net/ib67505">
            Open Weltrade Account
          </Button>
        </Section>

        <Text style={textSmall}>
          Having accounts on multiple brokers gives you flexibility to trade
          any signal we send — different assets, different expiry times.
        </Text>

        <Text style={footer}>
          If you didn't create a Botvio account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
}
const link = { color: '#D4940A', textDecoration: 'underline' }
const button = {
  backgroundColor: '#D4940A',
  color: '#0D1117',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '8px',
  padding: '14px 28px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#808899', margin: '30px 0 0' }
const divider = { borderColor: '#1C2333', margin: '28px 0' }
const h2 = {
  fontSize: '17px',
  fontWeight: 'bold' as const,
  color: '#0D1117',
  margin: '0 0 8px',
}
const textSmall = {
  fontSize: '13px',
  color: '#808899',
  lineHeight: '1.5',
  margin: '0 0 16px',
}
const brokerRow = { margin: '0 0 10px' }
const brokerBtnBase = {
  fontSize: '14px',
  fontWeight: 'bold' as const,
  borderRadius: '6px',
  padding: '12px 24px',
  textDecoration: 'none',
  display: 'inline-block' as const,
  width: '100%',
  textAlign: 'center' as const,
}
const brokerBtnDeriv = { ...brokerBtnBase, backgroundColor: '#FF444F', color: '#ffffff' }
const brokerBtnExness = { ...brokerBtnBase, backgroundColor: '#D4940A', color: '#0D1117' }
const brokerBtnWeltrade = { ...brokerBtnBase, backgroundColor: '#0066FF', color: '#ffffff' }
