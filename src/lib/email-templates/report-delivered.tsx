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

interface ReportDeliveredEmailProps {
  downloadUrl?: string
  reportName?: string
}

const ReportDeliveredEmail = ({ downloadUrl, reportName }: ReportDeliveredEmailProps) => {
  const url = downloadUrl || 'https://jeffhallstead.com'
  const name = reportName || 'Publisher Blueprint report'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your Publisher Blueprint report is ready for download.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>PUBLISHER BLUEPRINT</Text>
          <Heading style={heading}>Your report is ready.</Heading>
          <Text style={paragraph}>
            Your Publisher Blueprint report ({name}) has been generated and is ready to download.
            The link below is private and will remain active for 7 days.
          </Text>
          <Section style={buttonWrap}>
            <Button href={url} style={button}>
              Download my report
            </Button>
          </Section>
          <Text style={paragraph}>
            If the button does not work, paste this link into your browser:
          </Text>
          <Text style={linkWrap}>
            <a href={url} style={link}>
              {url}
            </a>
          </Text>
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
  component: ReportDeliveredEmail,
  subject: 'Your Publisher Blueprint report is ready',
  displayName: 'Report delivered email',
  previewData: {
    downloadUrl: 'https://jeffhallstead.com',
    reportName: 'publisher-blueprint-2026-08-01',
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

const linkWrap = {
  fontSize: '13px',
  wordBreak: 'break-all' as const,
  margin: '0 0 16px',
}

const link = {
  color: '#6366f1',
  textDecoration: 'underline',
}

const hr = { borderColor: '#e6e8eb', margin: '32px 0 16px' }

const footnote = { fontSize: '12px', color: '#6b7280', margin: 0 }
