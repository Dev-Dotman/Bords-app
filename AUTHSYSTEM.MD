Productivity App Authentication & Subscription System (MongoDB + Paystack)

Version: 1.0
Date: 2026-01-02
Prepared For: Solo productivity app MVP with future team support

⸻

1. Overview

This document outlines a MongoDB-based authentication and subscription system for a productivity SaaS app. It’s designed to:
	•	Be simple for MVP
	•	Use Paystack as the payment provider
	•	Support future team accounts
	•	Be scalable for optional OAuth and MFA

⸻

2. Authentication System

2.1 Goals
	•	Securely identify users
	•	Enable email verification and password resets
	•	Prepare for OAuth and MFA later
	•	Keep user friction low

2.2 Recommended Stack
	•	Auth.js (NextAuth) for auth flows
	•	Email + Password (primary login)
	•	Optional Google OAuth
	•	Optional TOTP (Speakeasy) for MFA later

⸻

2.3 MongoDB Collections / Schemas

Users Collection
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true }, // nullable if OAuth-only
  emailVerifiedAt: { type: Date, default: null },
  name: { type: String, default: "" },
  image: { type: String, default: "" },
  mfaEnabled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

PasswordResetTokens Collection
const PasswordResetTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

EmailVerificationTokens Collection
const EmailVerificationTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

Sessions Collection
const SessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sessionToken: { type: String, unique: true, required: true },
  expires: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

2.4 Authentication Flow
	1.	Signup → create User → send email verification
	2.	Login → verify password → optional MFA (future)
	3.	Password Reset → create PasswordResetToken → verify token → reset password
	4.	Optional OAuth → Account collection can map providers to users

⸻

3. Subscription System (Paystack)

3.1 Goals
	•	Track subscriptions in MongoDB
	•	Send reminders before expiry
	•	Use Paystack for payments
	•	Support team accounts in the future

⸻

3.2 MongoDB Collections / Schemas

Plans Collection (static)
const PlanSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Free, Pro, Team
  price: { type: Number, required: true },
  currency: { type: String, required: true },
  features: { type: mongoose.Schema.Types.Mixed }, // JSON object
  createdAt: { type: Date, default: Date.now },
});

Subscriptions Collection
const SubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  planName: { type: String, required: true },
  planPrice: { type: Number, required: true },
  status: { type: String, enum: ["active","expired","canceled"], default: "active" },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  autoRenew: { type: Boolean, default: false },
  lastPaymentId: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

Payments Collection 
const PaymentSchema = new mongoose.Schema({
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  paystackRef: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  status: { type: String, enum: ["success","failed","pending"], required: true },
  createdAt: { type: Date, default: Date.now },
});

SubscriptionHistory Collection (Audit Trail)
const SubscriptionHistorySchema = new mongoose.Schema({
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, enum: ["created","renewed","upgraded","downgraded","canceled","expired"], required: true },
  previousStatus: { type: String, default: "" },
  newStatus: { type: String, required: true },
  previousPlan: { type: String, default: "" },
  newPlan: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed }, // Additional context
  createdAt: { type: Date, default: Date.now },
});

3.3 Subscription Workflow

Step 1: Subscribe / Upgrade
	1.	User selects a plan → Paystack payment link
	2.	On webhook success → update Subscriptions collection:
	•	status = active
	•	startDate = today
	•	endDate = today + plan duration
	•	lastPaymentId = paystackRef

Step 2: Reminders
	•	Daily cron job checks:
    if(subscription.endDate - new Date() <= 3 && subscription.status === "active") {
  sendReminderEmail(user)
}

Step 3: Renewal
	•	User clicks link → Paystack payment → webhook updates endDate & lastPaymentId

Step 4: Expired Subscriptions
	•	Status set to expired → feature access restricted

⸻

3.4 International Payments
	•	Paystack supports foreign cards (Visa, MasterCard, AMEX)
	•	Payments converted to NGN in your account
	•	3D Secure is required for international cards
	•	Webhooks work the same as local payments

⸻

4. Optional Future Features
	•	OAuth support → Account collection linking providers to User
	•	MFA via TOTP → mfaEnabled + mfaSecret fields
	•	Team/Workspace support:

    const WorkspaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});
	•	Add security fields to User schema:
    const UserSchema = new mongoose.Schema({
  // ... existing fields
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  lastLoginAt: { type: Date },
  lastLoginIp: { type: String },
});

5.1 Database Indexes (Performance)

Users Collection Indexes:
UserSchema.index({ email: 1 });
UserSchema.index({ emailVerifiedAt: 1 });

Sessions Collection Indexes:
SessionSchema.index({ sessionToken: 1 });
SessionSchema.index({ userId: 1 });
SessionSchema.index({ expires: 1 }); // For cleanup cron

Subscriptions Collection Indexes:
SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ endDate: 1, status: 1 }); // For reminder cron
SubscriptionSchema.index({ status: 1 });

Payments Collection Indexes:
PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ subscriptionId: 1 });
PaymentSchema.index({ paystackRef: 1 });

Token Collections Indexes:
PasswordResetTokenSchema.index({ tokenHash: 1 });
PasswordResetTokenSchema.index({ userId: 1, usedAt: 1 });
EmailVerificationTokenSchema.index({ tokenHash: 1 });
EmailVerificationTokenSchema.index({ userId: 1 });


⸻

8. Implementation Plan

PHASE 1: FOUNDATION (Database & Auth Core)
────────────────────────────────────────────

Step 1.1: Environment Setup
  □ Install dependencies (mongoose, bcryptjs/argon2, next-auth)
  □ Set up MongoDB connection
  □ Create .env.local with MongoDB URI, NEXTAUTH_SECRET, NEXTAUTH_URL
  
Step 1.2: Database Models
  □ Create /src/models/User.ts
  □ Create /src/models/Session.ts
  □ Create /src/models/PasswordResetToken.ts
  □ Create /src/models/EmailVerificationToken.ts
  □ Add all indexes to models
  
Step 1.3: Database Connection
  □ Create /src/lib/mongodb.ts (connection handler)
  □ Test connection
  
Step 1.4: Auth.js Setup
  □ Create /src/app/api/auth/[...nextauth]/route.ts
  □ Configure Credentials provider
  □ Set up session strategy (database)
  □ Create custom pages (signin, signup)

PHASE 2: AUTHENTICATION FEATURES
────────────────────────────────────────────

Step 2.1: User Registration
  □ Create /src/app/api/auth/signup/route.ts
  □ Hash passwords with bcrypt/argon2
  □ Generate email verification token
  □ Send verification email
  □ Test signup flow
  
Step 2.2: Email Verification
  □ Create /src/app/api/auth/verify-email/route.ts
  □ Token validation logic
  □ Update user.emailVerifiedAt
  □ Create verification email template
  
Step 2.3: Login Flow
  □ Update signin page with form
  □ Check emailVerifiedAt before allowing login
  □ Implement rate limiting (5 attempts per 15min)
  □ Track loginAttempts and lockUntil
  □ Update lastLoginAt and lastLoginIp
  
Step 2.4: Password Reset
  □ Create /src/app/api/auth/forgot-password/route.ts
  □ Create /src/app/api/auth/reset-password/route.ts
  □ Generate reset tokens
  □ Send reset email
  □ Create reset password page
  □ Test full reset flow

PHASE 3: SUBSCRIPTION SYSTEM
────────────────────────────────────────────

Step 3.1: Subscription Models
  □ Create /src/models/Plan.ts
  □ Create /src/models/Subscription.ts
  □ Create /src/models/Payment.ts
  □ Create /src/models/SubscriptionHistory.ts
  □ Add indexes
  
Step 3.2: Plan Configuration
  □ Create /src/config/plans.ts (Free, Pro, Team tiers)
  □ Define feature flags per plan
  □ Seed plans to database (optional) or keep in code
  
Step 3.3: Paystack Integration
  □ Install paystack package
  □ Create /src/lib/paystack.ts (initialize payment, verify transaction)
  □ Create /src/app/api/subscribe/route.ts (initiate subscription)
  □ Create /src/app/api/webhooks/paystack/route.ts
  □ Verify webhook signatures
  
Step 3.4: Subscription Logic
  □ Create subscription on payment success
  □ Update SubscriptionHistory on changes
  □ Calculate endDate (startDate + plan duration)
  □ Create helper: /src/lib/subscription.ts (getUserSubscription, hasAccess)
  
Step 3.5: Feature Gating
  □ Create middleware to check subscription status
  □ Add plan-based access control to protected routes
  □ Show upgrade prompts for locked features
  □ Test access restrictions

PHASE 4: EMAIL & NOTIFICATIONS
────────────────────────────────────────────

Step 4.1: Email Service Setup
  □ Choose provider (Resend, SendGrid, Nodemailer)
  □ Create /src/lib/email.ts
  □ Create email templates folder /src/emails/
  
Step 4.2: Email Templates
  □ Welcome email template
  □ Email verification template
  □ Password reset template
  □ Subscription confirmation template
  □ Payment success template
  □ Subscription reminder template (3 days before expiry)
  □ Subscription expired template
  
Step 4.3: Cron Jobs Setup
  □ Install vercel-cron or node-cron
  □ Create /src/app/api/cron/subscription-reminders/route.ts
  □ Query subscriptions expiring in 3 days
  □ Send reminder emails
  □ Create /src/app/api/cron/expire-subscriptions/route.ts
  □ Update expired subscriptions (status = "expired")

PHASE 5: USER DASHBOARD
────────────────────────────────────────────

Step 5.1: Account Settings Page
  □ Create /src/app/dashboard/settings/page.tsx
  □ Display user info (name, email, emailVerifiedAt)
  □ Change password form
  □ Update profile form
  
Step 5.2: Subscription Management Page
  □ Create /src/app/dashboard/subscription/page.tsx
  □ Show current plan, status, endDate
  □ Upgrade/downgrade buttons
  □ Cancel subscription button
  □ Display payment history
  
Step 5.3: Billing History
  □ Create /src/app/dashboard/billing/page.tsx
  □ List all payments with status
  □ Download invoice functionality (optional)

PHASE 6: TESTING & POLISH
────────────────────────────────────────────

Step 6.1: Testing
  □ Test signup → verification → login flow
  □ Test password reset flow
  □ Test subscription purchase (Paystack test mode)
  □ Test webhook handling
  □ Test feature gating
  □ Test expiry and reminders
  □ Test rate limiting
  
Step 6.2: Error Handling
  □ Add try-catch blocks to all API routes
  □ Create error logging system
  □ User-friendly error messages
  □ Toast notifications for errors
  
Step 6.3: Security Audit
  □ Review password hashing
  □ Check webhook signature verification
  □ Ensure HTTPS in production
  □ Review rate limiting
  □ Check token expiry times
  □ Validate all user inputs
  
Step 6.4: Documentation
  □ API endpoint documentation
  □ Developer setup guide
  □ Deployment guide
  □ User guide

PHASE 7: DEPLOYMENT
────────────────────────────────────────────

Step 7.1: Pre-deployment
  □ Set environment variables in production
  □ Configure MongoDB Atlas production cluster
  □ Set up Paystack production keys
  □ Configure email service for production
  
Step 7.2: Deploy
  □ Deploy to Vercel/hosting platform
  □ Test production environment
  □ Monitor error logs
  □ Set up cron jobs in production
  
Step 7.3: Post-deployment
  □ Monitor webhook delivery
  □ Check email delivery rates
  □ Monitor subscription renewals
  □ Set up analytics

PHASE 8: FUTURE ENHANCEMENTS (Post-MVP)
────────────────────────────────────────────

Step 8.1: OAuth Integration
  □ Add Google OAuth provider to Auth.js
  □ Create Account model for provider mapping
  □ Test OAuth flow
  
Step 8.2: MFA Implementation
  □ Install speakeasy for TOTP
  □ Add mfaSecret field to User model
  □ Create MFA setup page
  □ Create MFA verification flow
  
Step 8.3: Team/Workspace Support
  □ Create Workspace and WorkspaceMember models
  □ Implement team invitation system
  □ Create workspace management UI
  □ Update subscription model for team plans

⸻

9. Dependency Checklist

Required Packages:
  □ mongoose (MongoDB ODM)
  □ next-auth (Auth.js for Next.js)
  □ bcryptjs or argon2 (password hashing)
  □ @paystack/inline-js or paystack npm package
  □ nodemailer or @sendgrid/mail or resend (email)
  □ crypto (built-in, for token generation)
  □ zod (input validation)
  □ date-fns (date manipulation)

Optional:
  □ node-cron (cron jobs, if not using Vercel Cron)
  □ speakeasy (TOTP for MFA - Phase 8)
  □ qrcode (QR codes for MFA - Phase 8)

⸻

10. Environment Variables Template

# Database
MONGODB_URI=mongodb+srv://...

# Auth.js
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Paystack
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...

# Email Service (example: Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
SubscriptionHistory Collection Indexes:
SubscriptionHistorySchema.index({ userId: 1, createdAt: -1 });
SubscriptionHistorySchema.index({ subscriptionId: 1, createdAt: -1 });

const WorkspaceMemberSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, enum: ["owner","admin","member"], default: "member" },
});

5. Security Recommendations
	•	Hash passwords (argon2 / bcrypt)
	•	Encrypt sensitive data at rest
	•	Rate-limit login/payment endpoints
	•	Verify Paystack webhooks using signature
	•	Use HTTPS and secure cookies

6. Notes for Implementation
	•	Skip OAuth and MFA for MVP
	•	Use DB entitlements to gate features
	•	Cron jobs handle subscription reminders and expirations
	•	Design collections with future expansion in mind

⸻

7. System Architecture Overview

[User Collection] 
   │
   ├─ Authentication (Email/Password via Auth.js)
   │      └─ Optional OAuth / future MFA
   │
[Subscriptions Collection] ── tracks plan, start/end, status
   │
   ├─ Payments Collection (Paystack)
   │      └─ Webhook updates subscription
   │
   └─ Reminders (Cron/email)
          └─ Notify users of upcoming expiry