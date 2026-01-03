import { getEmailTemplate } from './base'

interface PasswordResetEmailProps {
  name: string
  resetUrl: string
}

export function getPasswordResetEmail({ name, resetUrl }: PasswordResetEmailProps): string {
  const content = `
    <p>Hi ${name}! 👋</p>
    
    <p>
      We received a request to reset the password for your <strong>Boards</strong> account.
    </p>
    
    <p>
      Click the button below to choose a new password. This link will expire in <strong>1 hour</strong> for your security.
    </p>
    
    <div class="security-notice">
      <p>
        <strong>🔒 Security Notice:</strong><br/>
        If you didn't request a password reset, please ignore this email or contact support if you have concerns. Your password will remain unchanged.
      </p>
    </div>
    
    <p style="font-size: 14px; color: #718096; margin-top: 24px;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
    </p>
  `

  return getEmailTemplate({
    title: 'Reset Your Password',
    preheader: 'You requested to reset your password',
    content,
    ctaText: 'Reset Password',
    ctaUrl: resetUrl,
  })
}
