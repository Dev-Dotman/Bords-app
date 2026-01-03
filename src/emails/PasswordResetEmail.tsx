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

interface PasswordResetEmailProps {
  name: string
  resetUrl: string
}

export default function PasswordResetEmail({
  name = 'User',
  resetUrl = 'https://bords.app/reset-password',
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your BORDS password</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>BORDS</Heading>
            <Text style={tagline}>Your visual workspace</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={badge}>🔒 PASSWORD RESET</Text>
            <Heading style={heading}>Reset Your Password</Heading>

            <Text style={greeting}>Hi {name},</Text>

            <Text style={paragraph}>
              We received a request to reset your password for your BORDS account. If
              you didn't make this request, you can safely ignore this email.
            </Text>

            <Text style={paragraph}>
              To reset your password, click the button below:
            </Text>

            <Section style={buttonContainer}>
              <Button href={resetUrl} style={button}>
                Reset Password
              </Button>
            </Section>

            <Text style={paragraph}>
              Or copy and paste this URL into your browser:
            </Text>

            <Text style={link}>
              <Link href={resetUrl} style={linkStyle}>
                {resetUrl}
              </Link>
            </Text>

            <Section style={warningBox}>
              <Text style={warningTitle}>⚠️ Security Notice</Text>
              <Text style={warningText}>
                • This link will expire in 1 hour
              </Text>
              <Text style={warningText}>
                • For your security, this link can only be used once
              </Text>
              <Text style={warningText}>
                • If you didn't request this reset, please ignore this email
              </Text>
              <Text style={warningText}>
                • Your password will not change unless you click the link above
              </Text>
            </Section>

            <Text style={helpText}>
              If you continue to have problems, please contact our support team at{' '}
              <a href="mailto:support@bords.app" style={helpLink}>
                support@bords.app
              </a>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={footerDivider} />
            <Text style={footerNote}>
              You're receiving this email because a password reset was requested for
              your BORDS account.
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
  backgroundColor: '#fef3c7',
  color: '#92400e',
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

const warningBox = {
  backgroundColor: '#fffbeb',
  border: '1px solid #fbbf24',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '32px',
}

const warningTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#92400e',
  margin: '0 0 16px',
}

const warningText = {
  fontSize: '14px',
  lineHeight: '1.8',
  color: '#78350f',
  margin: '0 0 8px',
}

const helpText = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#6b7280',
  margin: '0',
  textAlign: 'center' as const,
}

const helpLink = {
  color: '#3b82f6',
  textDecoration: 'none',
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
