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
import type { TemplateEntry } from './registry'

interface WelcomeEmailProps {
  name?: string
  welcomeUrl?: string
}

const WelcomeEmail = ({ name, welcomeUrl }: WelcomeEmailProps) => {
  const url = welcomeUrl || 'https://jeffhallstead.com'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your Publisher Blueprint account is ready — start your assessment.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>PUBLISHER BLUEPRINT</Text>
          <Heading style={heading}>
            {name ? `Welcome, ${name}.` : 'Welcome aboard.'}
          </Heading>
          <Text style={paragraph}>
            Your account is ready. The Publisher Index assesses seven dimensions of publishing
            maturity and turns your answers into an executive score and a sequenced 90-day
            roadmap.
          </Text>
          <Text style={paragraph}>
            Set aside about twelve minutes and answer candidly — the roadmap is only as useful as
            the honesty behind the inputs.
          </Text>
          <Section style={buttonWrap}>
            <Button href={url} style={button}>
              Start your assessment
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footnote}>
            Questions? Reply to this email or write to support@jeffhallstead.com.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: WelcomeEmail,
  subject: 'Welcome to Publisher Blueprint',
  displayName: 'Welcome email',
  previewData: {
    name: 'Jordan',
    welcomeUrl: 'https://jeffhallstead.com/welcome',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Inter', Helvetica, Arial, sans-serif",
  color: '#101820',
}

const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '40px 28px',
}

const eyebrow = {
  fontSize: '11px',
  letterSpacing: '0.18em',
  color: '#6366f1',
  margin: '0 0 12px',
  fontWeight: 600 as const,
}

const heading = {
  fontSize: '28px',
  lineHeight: '1.2',
  margin: '0 0 20px',
  fontWeight: 600 as const,
}

const paragraph = {
  fontSize: '15px',
  lineHeight: '1.65',
  color: '#3d4650',
  margin: '0 0 16px',
}

const buttonWrap = { margin: '28px 0 8px' }

const button = {
  backgroundColor: '#101820',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 600 as const,
  padding: '13px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  display: 'inline-block',
}

const hr = { borderColor: '#e6e8eb', margin: '32px 0 16px' }

const footnote = { fontSize: '12px', color: '#6b7280', margin: 0 }
