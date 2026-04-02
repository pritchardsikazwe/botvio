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
    <Preview>Welcome to Botvio — AI signals, chart analysis, courses & more</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="Botvio" width="120" height="40" style={logo} />
        <Heading style={h1}>
          {name ? `Welcome aboard, ${name}! 🚀` : 'Welcome aboard! 🚀'}
        </Heading>
        <Text style={text}>
          You've joined thousands of traders using Botvio for AI-powered trading
          tools, education, and market insights. Here's everything waiting for you:
        </Text>

        <Heading style={h2}>📊 Subscription Plans</Heading>
        <Text style={text}>
          Choose a plan that fits your trading style — from Free Trial to VIP.
          Unlock premium signals, unlimited AI analysis, copy trading, and more
          as you level up.
        </Text>

        <Heading style={h2}>📈 AI Chart Analysis</Heading>
        <Text style={text}>
          Upload any chart screenshot and get instant AI-powered analysis with
          key levels, market structure, and trade ideas. Free users get 1 scan
          per day — upgrade for more.
        </Text>

        <Heading style={h2}>🎓 Trading Courses</Heading>
        <Text style={text}>
          Learn from our library of courses: Smart Money Concepts (SMC),
          Boom & Crash, Forex Masterclass, Binance Trading, and the Botvio
          Sniper strategy. All available in the Marketplace.
        </Text>

        <Heading style={h2}>⚡ Quick Access Shortcuts</Heading>
        <Text style={text}>
          🎯 Binary Signals — live AI-generated trade signals{'\n'}
          🔴 Botvio Live — watch traders stream in real-time{'\n'}
          ⚽ Sports Betting — AI-analysed bet slips{'\n'}
          🏆 Flipping Challenges — grow small accounts{'\n'}
          📰 News Calendar — stay ahead of market events{'\n'}
          💰 Gold Hub — dedicated XAU/USD analysis
        </Text>

        <Button style={button} href="https://botvio.live">
          Explore Botvio Now
        </Button>

        <Text style={footerNote}>
          💡 Tip: Tap the shortcut grid on the homepage to jump straight
          into any feature.
        </Text>

        <Text style={footer}>
          Need help? Reply to this email or visit botvio.live/docs.
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
