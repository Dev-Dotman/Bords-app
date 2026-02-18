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

interface OrganizationInviteEmailProps {
  organizationName: string
  inviterName: string
  inviterEmail: string
  role: 'employee' | 'collaborator'
  acceptUrl: string
}

export default function OrganizationInviteEmail({
  organizationName = 'Acme Corp',
  inviterName = 'Jane',
  inviterEmail = 'jane@example.com',
  role = 'employee',
  acceptUrl = 'https://bords.app',
}: OrganizationInviteEmailProps) {
  const roleLabel = role === 'employee' ? 'team member' : 'collaborator'

  return (
    <Html>
      <Head />
      <Preview>
        {inviterName} invited you to join {organizationName} on BORDS
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>BORDS</Heading>
            <Text style={tagline}>Your visual workspace</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={badge}>📩 INVITATION</Text>
            <Heading style={heading}>
              You&apos;ve been invited to join {organizationName}
            </Heading>

            <Text style={paragraph}>
              <strong>{inviterName}</strong> ({inviterEmail}) has invited you to
              join <strong>{organizationName}</strong> as a {roleLabel} on BORDS.
            </Text>

            <Section style={infoBox}>
              <Text style={infoTitle}>What this means:</Text>
              {role === 'employee' ? (
                <>
                  <Text style={infoItem}>
                    📋 You&apos;ll receive task assignments from boards in this organization
                  </Text>
                  <Text style={infoItem}>
                    ✅ Complete tasks directly from your Execution Inbox
                  </Text>
                  <Text style={infoItem}>
                    🔔 Get notified when new tasks are assigned to you
                  </Text>
                </>
              ) : (
                <>
                  <Text style={infoItem}>
                    🎨 You&apos;ll be able to view or edit boards shared with you
                  </Text>
                  <Text style={infoItem}>
                    🤝 Collaborate visually with your team
                  </Text>
                </>
              )}
            </Section>

            <Section style={buttonContainer}>
              <Button href={acceptUrl} style={button}>
                Accept Invitation →
              </Button>
            </Section>

            <Text style={helpText}>
              This invitation will expire in 7 days. If you don&apos;t have a BORDS
              account yet, you&apos;ll be able to create one after clicking the link above.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={footerDivider} />
            <Text style={footerNote}>
              You&apos;re receiving this email because {inviterName} invited you to
              join {organizationName} on BORDS.
            </Text>
            <Text style={footerNote}>
              If you didn&apos;t expect this invitation, you can safely ignore this email.
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

// Styles (consistent with other BORDS emails)
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
  fontSize: '24px',
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

const infoBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '32px',
}

const infoTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 16px',
}

const infoItem = {
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
