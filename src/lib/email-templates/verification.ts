import { getEmailTemplate } from './base'

interface VerificationEmailProps {
  name: string
  verificationUrl: string
}

export function getVerificationEmail({ name, verificationUrl }: VerificationEmailProps): string {
  const content = `
    <p>Hi ${name}! 👋</p>
    
    <p>
      Thank you for signing up for <strong>Boards</strong>! We're excited to have you on board.
    </p>
    
    <p>
      To complete your registration and start using all the amazing features, please verify your email address by clicking the button below:
    </p>
    
    <div class="security-notice">
      <p>
        <strong>🔒 Security Notice:</strong><br/>
        This verification link will expire in <strong>24 hours</strong> for your security. If you didn't create an account with Boards, please ignore this email.
      </p>
    </div>
    
    <p style="font-size: 14px; color: #718096; margin-top: 24px;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
    </p>
  `

  return getEmailTemplate({
    title: 'Verify Your Email Address',
    preheader: 'Please verify your email to activate your account',
    content,
    ctaText: 'Verify Email Address',
    ctaUrl: verificationUrl,
  })
}
