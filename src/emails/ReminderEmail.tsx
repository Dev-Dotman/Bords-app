import {
  Body,
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

interface ReminderItemData {
  text: string
  dueDate?: string    // formatted date string e.g. 'Mar 1, 3:00 PM'
  overdue?: boolean
  completed?: boolean
}

interface ReminderEmailProps {
  recipientName: string
  senderName: string
  reminderTitle: string
  items: ReminderItemData[]
  message?: string
  boardUrl?: string
}

export default function ReminderEmail({
  recipientName = 'User',
  senderName = 'A friend',
  reminderTitle = 'My Reminder',
  items = [{ text: 'Example item', dueDate: 'Mar 1, 3:00 PM' }],
  message,
  boardUrl = 'https://bords.app',
}: ReminderEmailProps) {
  const hasOverdue = items.some((i) => i.overdue && !i.completed)
  const pendingItems = items.filter((i) => !i.completed)
  const completedItems = items.filter((i) => i.completed)

  return (
    <Html>
      <Head />
      <Preview>
        {hasOverdue
          ? `⚠️ Overdue reminder from ${senderName}: ${reminderTitle}`
          : `🔔 Reminder from ${senderName}: ${reminderTitle}`}
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
            {hasOverdue ? (
              <>
                <Text style={urgentBadge}>⚠️ OVERDUE REMINDER</Text>
                <Heading style={heading}>You have overdue items</Heading>
              </>
            ) : (
              <>
                <Text style={reminderBadge}>🔔 REMINDER</Text>
                <Heading style={heading}>{reminderTitle}</Heading>
              </>
            )}

            <Text style={greeting}>Hi {recipientName},</Text>

            <Text style={paragraph}>
              <strong>{senderName}</strong> sent you a reminder:
            </Text>

            {message && (
              <Section style={messageBox}>
                <Text style={messageText}>"{message}"</Text>
              </Section>
            )}

            {/* Reminder Card */}
            <Section style={reminderCard}>
              <Text style={cardLabel}>Reminder</Text>
              <Text style={cardTitle}>{reminderTitle}</Text>

              {pendingItems.length > 0 && (
                <>
                  <Hr style={divider} />
                  <Text style={cardLabel}>
                    Pending Items ({pendingItems.length})
                  </Text>
                  {pendingItems.map((item, idx) => (
                    <Section key={idx} style={itemRow}>
                      <Text style={itemBullet}>○</Text>
                      <Section style={itemContent}>
                        <Text style={itemText}>{item.text}</Text>
                        {item.dueDate && (
                          <Text
                            style={
                              item.overdue ? itemDeadlineOverdue : itemDeadline
                            }
                          >
                            {item.overdue ? '⚠️ ' : '🕐 '}
                            {item.dueDate}
                          </Text>
                        )}
                      </Section>
                    </Section>
                  ))}
                </>
              )}

              {completedItems.length > 0 && (
                <>
                  <Hr style={divider} />
                  <Text style={cardLabel}>
                    Completed ({completedItems.length})
                  </Text>
                  {completedItems.map((item, idx) => (
                    <Section key={idx} style={itemRow}>
                      <Text style={itemBulletDone}>✓</Text>
                      <Text style={itemTextDone}>{item.text}</Text>
                    </Section>
                  ))}
                </>
              )}
            </Section>

            {boardUrl && (
              <Section style={buttonContainer}>
                <Link href={boardUrl} style={button}>
                  Open BORDS →
                </Link>
              </Section>
            )}

            <Text style={footerText}>
              Stay on top of your tasks and deadlines with BORDS.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={footerDivider} />
            <Text style={footerNote}>
              You received this email because {senderName} sent you a reminder on BORDS.
            </Text>
            <Text style={footerNote}>© 2026 BORDS. All rights reserved.</Text>
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

const reminderBadge = {
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

const urgentBadge = {
  display: 'inline-block',
  backgroundColor: '#fee2e2',
  color: '#991b1b',
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

const messageBox = {
  backgroundColor: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: '10px',
  padding: '16px 20px',
  marginBottom: '24px',
}

const messageText = {
  fontSize: '14px',
  fontStyle: 'italic' as const,
  color: '#92400e',
  margin: '0',
  lineHeight: '1.5',
}

const reminderCard = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '32px',
}

const cardLabel = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#6b7280',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 8px',
}

const cardTitle = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 4px',
}

const divider = {
  borderColor: '#e5e7eb',
  margin: '16px 0',
}

const itemRow = {
  marginBottom: '12px',
}

const itemBullet = {
  display: 'inline-block',
  fontSize: '14px',
  color: '#f59e0b',
  margin: '0 8px 0 0',
  fontWeight: '600',
}

const itemBulletDone = {
  display: 'inline-block',
  fontSize: '14px',
  color: '#10b981',
  margin: '0 8px 0 0',
  fontWeight: '600',
}

const itemContent = {
  display: 'inline-block',
}

const itemText = {
  fontSize: '15px',
  color: '#374151',
  margin: '0',
  lineHeight: '1.4',
}

const itemTextDone = {
  display: 'inline-block',
  fontSize: '14px',
  color: '#9ca3af',
  margin: '0',
  lineHeight: '1.4',
  textDecoration: 'line-through' as const,
}

const itemDeadline = {
  fontSize: '12px',
  color: '#f59e0b',
  margin: '2px 0 0',
  fontWeight: '500',
}

const itemDeadlineOverdue = {
  fontSize: '12px',
  color: '#ef4444',
  margin: '2px 0 0',
  fontWeight: '600',
}

const buttonContainer = {
  textAlign: 'center' as const,
  marginBottom: '32px',
}

const button = {
  backgroundColor: '#f59e0b',
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
  color: '#6b7280',
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
