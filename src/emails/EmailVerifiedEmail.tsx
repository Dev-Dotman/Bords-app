import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components'

interface EmailVerifiedEmailProps {
  name: string
}

export default function EmailVerifiedEmail({
  name = 'User',
}: EmailVerifiedEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bords.app'

  return (
    <Html>
      <Head />
      <Preview>Your email has been verified - Welcome to BORDS!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>BORDS</Heading>
            <Text style={tagline}>Your visual workspace</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={badge}>✅ VERIFIED</Text>
            <Heading style={heading}>Email Verified Successfully!</Heading>

            <Text style={greeting}>Hi {name},</Text>

            <Text style={paragraph}>
              Great news! Your email address has been successfully verified. Your
              account is now fully activated and ready to use.
            </Text>

            <Section style={successBox}>
              <Text style={successIcon}>🎉</Text>
              <Text style={successTitle}>You're all set!</Text>
              <Text style={successText}>
                Start creating beautiful boards, organizing your thoughts, and
                collaborating with your team.
              </Text>
            </Section>

            <Text style={paragraph}>
              Here are some things you can do to get started:
            </Text>

            <Text style={listItem}>• Create your first board</Text>
            <Text style={listItem}>• Add sticky notes and checklists</Text>
            <Text style={listItem}>• Customize your workspace with backgrounds</Text>
            <Text style={listItem}>• Connect ideas visually</Text>

            <Section style={buttonContainer}>
              <Button href={appUrl} style={button}>
                Go to BORDS →
              </Button>
            </Section>

            <Text style={footerText}>
              If you have any questions or need help, feel free to reach out to our
              support team. We're here to help!
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={footerDivider} />
            <Text style={footerNote}>
              You're receiving this email because you verified your BORDS account.
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
  backgroundColor: '#dcfce7',
  color: '#166534',
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

const successBox = {
  backgroundColor: '#f0fdf4',
  border: '2px solid #86efac',
  borderRadius: '12px',
  padding: '32px',
  marginBottom: '32px',
  textAlign: 'center' as const,
}

const successIcon = {
  fontSize: '48px',
  margin: '0 0 16px',
}

const successTitle = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#166534',
  margin: '0 0 12px',
}

const successText = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#15803d',
  margin: '0',
}

const listItem = {
  fontSize: '15px',
  lineHeight: '1.8',
  color: '#6b7280',
  margin: '0 0 8px',
  paddingLeft: '8px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  marginBottom: '32px',
  marginTop: '32px',
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

const footerText = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#9ca3af',
  margin: '0',
  textAlign: 'center' as const,
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
