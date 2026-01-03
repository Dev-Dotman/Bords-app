import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components'

interface VerificationEmailProps {
  name: string
  verificationUrl: string
}

export default function VerificationEmail({
  name = 'User',
  verificationUrl = 'https://bords.app/verify-email',
}: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your email address to get started with BORDS</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>BORDS</Heading>
            <Text style={tagline}>Your visual workspace</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={badge}>✉️ EMAIL VERIFICATION</Text>
            <Heading style={heading}>Verify your email address</Heading>

            <Text style={greeting}>Hi {name},</Text>

            <Text style={paragraph}>
              Welcome to BORDS! We're excited to have you on board. To complete your
              registration and start organizing your work visually, please verify your
              email address.
            </Text>

            <Text style={paragraph}>
              Click the button below to verify your email and activate your account:
            </Text>

            <Section style={buttonContainer}>
              <Button href={verificationUrl} style={button}>
                Verify Email Address
              </Button>
            </Section>

            <Text style={paragraph}>
              Or copy and paste this URL into your browser:
            </Text>

            <Text style={link}>
              <Link href={verificationUrl} style={linkStyle}>
                {verificationUrl}
              </Link>
            </Text>

            <Text style={note}>
              This verification link will expire in 24 hours. If you didn't create an
              account with BORDS, you can safely ignore this email.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={footerDivider} />
            <Text style={footerNote}>
              You're receiving this email because you signed up for BORDS.
            </Text>
            <Text style={footerNote}>
              © 2026 BORDS. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const header = {
  padding: '32px 48px 24px',
  textAlign: 'center' as const,
  backgroundColor: '#000000',
}

const logo = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#ffffff',
  margin: '0 0 8px',
  letterSpacing: '2px',
}

const tagline = {
  fontSize: '14px',
  color: '#60a5fa',
  margin: '0',
  fontWeight: '500',
}

const content = {
  padding: '0 48px',
}

const badge = {
  display: 'inline-block',
  backgroundColor: '#dbeafe',
  color: '#1e40af',
  padding: '6px 12px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: '600',
  letterSpacing: '0.5px',
  marginTop: '32px',
  marginBottom: '16px',
}

const heading = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#1f2937',
  margin: '0 0 24px',
  lineHeight: '1.3',
}

const greeting = {
  fontSize: '16px',
  color: '#374151',
  margin: '0 0 16px',
  fontWeight: '500',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#6b7280',
  margin: '0 0 24px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  marginBottom: '32px',
}

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  lineHeight: '1.5',
}

const link = {
  marginBottom: '24px',
  display: 'block',
}

const linkStyle = {
  color: '#3b82f6',
  fontSize: '14px',
  wordBreak: 'break-all' as const,
}

const note = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#9ca3af',
  margin: '0',
  padding: '16px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
}

const footer = {
  padding: '0 48px',
  marginTop: '32px',
}

const footerDivider = {
  borderColor: '#e5e7eb',
  margin: '32px 0 24px',
}

const footerNote = {
  fontSize: '12px',
  lineHeight: '1.6',
  color: '#9ca3af',
  margin: '0 0 8px',
  textAlign: 'center' as const,
}
