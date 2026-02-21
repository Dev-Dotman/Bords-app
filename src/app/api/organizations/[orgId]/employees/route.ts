import { NextRequest, NextResponse } from 'next/server'
import { render } from '@react-email/components'
import connectDB from '@/lib/mongodb'
import Organization from '@/models/Organization'
import EmployeeMembership from '@/models/EmployeeMembership'
import Invitation from '@/models/Invitation'
import Notification from '@/models/Notification'
import User from '@/models/User'
import { getAuthUser, unauthorized, notFound, forbidden, badRequest } from '@/lib/api-helpers'
import { generateToken } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import OrganizationInviteEmail from '@/emails/OrganizationInviteEmail'

// GET /api/organizations/[orgId]/employees — list employees
// Org owner and org members can view the list; only owner sees pending invitations.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { orgId } = await params
  await connectDB()

  const org = await Organization.findById(orgId).lean()
  if (!org) return notFound('Organization')

  const isOwner = org.ownerId.toString() === user.id

  // If not owner, verify the user is at least a member
  if (!isOwner) {
    const membership = await EmployeeMembership.findOne({
      organizationId: orgId,
      userId: user.id,
    }).lean()
    if (!membership) return forbidden()
  }

  const memberships = await EmployeeMembership.find({ organizationId: orgId })
    .populate('userId', 'email firstName lastName image')
    .lean()

  const employees = memberships.map((m: any) => ({
    _id: m._id.toString(),
    organizationId: m.organizationId.toString(),
    userId: m.userId._id.toString(),
    user: {
      _id: m.userId._id.toString(),
      email: m.userId.email,
      firstName: m.userId.firstName,
      lastName: m.userId.lastName,
      image: m.userId.image,
    },
    createdAt: m.createdAt?.toISOString(),
  }))

  // Only show pending invitations to the owner
  let pendingInvitations: any[] = []
  if (isOwner) {
    const invitations = await Invitation.find({
      organizationId: orgId,
      role: 'employee',
      status: 'pending',
    }).lean()
    pendingInvitations = invitations.map((i: any) => ({
      _id: i._id.toString(),
      email: i.email,
      status: i.status,
      createdAt: i.createdAt?.toISOString(),
    }))
  }

  return NextResponse.json({
    employees,
    pendingInvitations,
    isOwner,
  })
}

// POST /api/organizations/[orgId]/employees — invite an employee
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { orgId } = await params
  const body = await req.json()
  const { email } = body

  if (!email?.trim()) return badRequest('Email is required')

  await connectDB()

  const org = await Organization.findById(orgId).lean()
  if (!org) return notFound('Organization')
  if (org.ownerId.toString() !== user.id) return forbidden()

  const normalizedEmail = email.trim().toLowerCase()

  // Can't invite yourself
  if (normalizedEmail === user.email?.toLowerCase()) {
    return badRequest('You cannot invite yourself')
  }

  // Check if already an employee
  const existingUser = await User.findOne({ email: normalizedEmail }).lean() as any
  if (existingUser) {
    const existingMembership = await EmployeeMembership.findOne({
      organizationId: orgId,
      userId: existingUser._id,
    })
    if (existingMembership) {
      return badRequest('User is already an employee of this organization')
    }
  }

  // Check for existing pending invitation
  const existingInvite = await Invitation.findOne({
    organizationId: orgId,
    email: normalizedEmail,
    status: 'pending',
  })
  if (existingInvite) {
    return badRequest('Invitation already sent to this email')
  }

  // Create the invitation
  const token = generateToken()
  const invitation = await Invitation.create({
    organizationId: orgId,
    email: normalizedEmail,
    role: 'employee',
    invitedBy: user.id,
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  })

  const inviterName = user.name || user.email || 'Someone'
  const baseUrl = process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://app.bords.app'

  // If user exists on the platform — create an in-app notification with CTA
  if (existingUser) {
    await Notification.create({
      userId: existingUser._id,
      type: 'org_invitation',
      title: `Invitation to join ${(org as any).name}`,
      message: `${inviterName} invited you to join ${(org as any).name} as a team member`,
      metadata: {
        organizationId: orgId,
        organizationName: (org as any).name,
        invitationId: invitation._id.toString(),
      },
      isRead: false,
    })
  }

  // Send invitation email (to both existing and new users)
  try {
    const invitePageUrl = `${baseUrl}/invite/${token}`
    const emailHtml = await render(
      OrganizationInviteEmail({
        organizationName: (org as any).name,
        inviterName,
        inviterEmail: user.email || '',
        role: 'employee',
        acceptUrl: invitePageUrl,
      })
    )

    await sendEmail({
      to: normalizedEmail,
      subject: `${inviterName} invited you to join ${(org as any).name} on BORDS`,
      html: emailHtml,
    })
  } catch (error) {
    console.error('Failed to send invitation email:', error)
    // Don't fail the invitation if email fails — the in-app notification still works
  }

  return NextResponse.json({
    invitation: {
      _id: invitation._id.toString(),
      email: normalizedEmail,
      status: 'pending',
      createdAt: invitation.createdAt?.toISOString(),
    },
  }, { status: 201 })
}
