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

interface WelcomeEmailProps {
  name: string
  email: string
}

export default function WelcomeEmail({
  name = 'User',
  email = 'user@example.com',
}: WelcomeEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bords.app'

  return (
    <Html>
      <Head />
      <Preview>Welcome to BORDS - Your visual workspace awaits!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>BORDS</Heading>
            <Text style={tagline}>Your visual workspace</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={badge}>🎉 WELCOME</Text>
            <Heading style={heading}>Welcome to BORDS, {name}!</Heading>

            <Text style={paragraph}>
              We're thrilled to have you join our community of visual thinkers and
              organizers. BORDS is designed to help you bring your ideas to life and
              stay organized in a beautiful, intuitive way.
            </Text>

            <Section style={featureBox}>
              <Text style={featureTitle}>✨ What you can do with BORDS:</Text>
              <Text style={featureItem}>
                📝 <strong>Create Sticky Notes</strong> - Capture ideas and organize thoughts
              </Text>
              <Text style={featureItem}>
                ✅ <strong>Build Checklists</strong> - Track tasks and stay productive
              </Text>
              <Text style={featureItem}>
                🎨 <strong>Customize Boards</strong> - Personalize with colors and backgrounds
              </Text>
              <Text style={featureItem}>
                🔗 <strong>Connect Items</strong> - Visualize relationships between ideas
              </Text>
              <Text style={featureItem}>
                📊 <strong>Organize Visually</strong> - Drag, drop, and arrange freely
              </Text>
            </Section>

            <Text style={paragraph}>
              Your account has been created with the email: <strong>{email}</strong>
            </Text>

            <Section style={buttonContainer}>
              <Button href={appUrl} style={button}>
                Start Creating →
              </Button>
            </Section>

            <Text style={helpText}>
              Need help getting started? Check out our{' '}
              <a href={`${appUrl}/docs`} style={helpLink}>
                documentation
              </a>{' '}
              or reach out to our support team anytime.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={footerDivider} />
            <Text style={footerNote}>
              You're receiving this email because you created an account on BORDS.
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

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#6b7280',
  margin: '0 0 24px',
}

const featureBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '32px',
}

const featureTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 16px',
}

const featureItem = {
  fontSize: '15px',
  lineHeight: '1.8',
  color: '#6b7280',
  margin: '0 0 12px',
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
