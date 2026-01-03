import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components'

interface ChecklistReminderEmailProps {
  userName: string
  checklistTitle: string
  taskText: string
  timeRemaining: string
  deadline: string
  boardUrl?: string
}

export default function ChecklistReminderEmail({
  userName = 'User',
  checklistTitle = 'My Checklist',
  taskText = 'Complete project review',
  timeRemaining = '30 minutes',
  deadline = 'Jan 3, 2026 @ 3:00 PM',
  boardUrl = 'https://bords.app/board',
}: ChecklistReminderEmailProps) {
  const isOverdue = timeRemaining === 'overdue'

  return (
    <Html>
      <Head />
      <Preview>
        {isOverdue
          ? `⚠️ Task deadline reached: ${taskText}`
          : `⏰ Reminder: ${taskText} is due in ${timeRemaining}`}
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
            {isOverdue ? (
              <>
                <Text style={urgentBadge}>⚠️ DEADLINE REACHED</Text>
                <Heading style={heading}>Your task deadline has arrived</Heading>
              </>
            ) : (
              <>
                <Text style={reminderBadge}>⏰ REMINDER</Text>
                <Heading style={heading}>
                  Task due in {timeRemaining}
                </Heading>
              </>
            )}

            <Text style={greeting}>Hi {userName},</Text>

            <Text style={paragraph}>
              This is a friendly reminder about your upcoming task:
            </Text>

            {/* Task Card */}
            <Section style={taskCard}>
              <Text style={taskCardLabel}>Checklist</Text>
              <Text style={taskCardTitle}>{checklistTitle}</Text>
              <Hr style={divider} />
              <Text style={taskCardLabel}>Task</Text>
              <Text style={taskCardTask}>{taskText}</Text>
              <Hr style={divider} />
              <Text style={taskCardLabel}>Deadline</Text>
              <Text style={taskCardDeadline}>{deadline}</Text>
              {!isOverdue && (
                <>
                  <Hr style={divider} />
                  <Text style={taskCardLabel}>Time Remaining</Text>
                  <Text style={timeRemainingText}>{timeRemaining}</Text>
                </>
              )}
            </Section>

            {boardUrl && (
              <Section style={buttonContainer}>
                <Link href={boardUrl} style={button}>
                  View on BORDS →
                </Link>
              </Section>
            )}

            <Text style={footerText}>
              {isOverdue
                ? "Don't worry, you can still complete this task. Click above to access your board."
                : 'Stay on top of your tasks and deadlines with BORDS.'}
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={footerDivider} />
            <Text style={footerNote}>
              You're receiving this email because you set a deadline reminder on BORDS.
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

const reminderBadge = {
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

const taskCard = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '32px',
}

const taskCardLabel = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#6b7280',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 8px',
}

const taskCardTitle = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 16px',
}

const taskCardTask = {
  fontSize: '16px',
  color: '#374151',
  margin: '0 0 16px',
  lineHeight: '1.5',
}

const taskCardDeadline = {
  fontSize: '16px',
  fontWeight: '500',
  color: '#ef4444',
  margin: '0 0 16px',
}

const timeRemainingText = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#f59e0b',
  margin: '0',
}

const divider = {
  borderColor: '#e5e7eb',
  margin: '16px 0',
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
