import { getEmailTemplate } from './base'

interface PasswordResetSuccessProps {
  name: string
}

export function getPasswordResetSuccessEmail({ name }: PasswordResetSuccessProps): string {
  const content = `
    <p>Hi ${name}! 👋</p>
    
    <p>
      This is a confirmation that your <strong>Boards</strong> account password has been successfully changed.
    </p>
    
    <p>
      You can now log in to your account using your new password.
    </p>
    
    <div class="security-notice">
      <p>
        <strong>🔒 Security Alert:</strong><br/>
        If you didn't change your password, please contact our support team immediately. Your account security is our top priority.
      </p>
    </div>
    
    <p>
      For your security, we recommend:
    </p>
    
    <ul style="color: #4a5568; font-size: 16px; line-height: 1.6;">
      <li>Using a unique, strong password</li>
      <li>Not sharing your password with anyone</li>
      <li>Enabling two-factor authentication (coming soon)</li>
    </ul>
  `

  return getEmailTemplate({
    title: 'Password Successfully Changed',
    preheader: 'Your password has been updated',
    content,
    ctaText: 'Log In to Your Account',
    ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
  })
}
