import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Invitation from '@/models/Invitation'
import Organization from '@/models/Organization'
import EmployeeMembership from '@/models/EmployeeMembership'
import Notification from '@/models/Notification'
import { getAuthUser, unauthorized, notFound, badRequest } from '@/lib/api-helpers'

// POST /api/invitations/[invitationId]/accept — accept an organization invitation
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { invitationId } = await params

  await connectDB()

  const invitation = await Invitation.findById(invitationId)
  if (!invitation) return notFound('Invitation')

  console.log('🔍 Accept invite debug:', {
    invitationEmail: invitation.email,
    userEmail: user.email,
    userEmailLower: user.email?.toLowerCase(),
    match: invitation.email === user.email?.toLowerCase(),
    status: invitation.status,
    expired: new Date() > invitation.expiresAt,
  })

  // Verify the invitation is for this user's email
  if (invitation.email !== user.email?.toLowerCase()) {
    return badRequest('This invitation is not for your account')
  }

  // Check if already accepted
  if (invitation.status === 'accepted') {
    return badRequest('Invitation has already been accepted')
  }

  // Check if expired
  if (invitation.status === 'expired' || new Date() > invitation.expiresAt) {
    invitation.status = 'expired'
    await invitation.save()
    return badRequest('Invitation has expired')
  }

  // Verify the org still exists
  const org = await Organization.findById(invitation.organizationId).lean()
  if (!org) return notFound('Organization')

  // Check if already a member
  const existingMembership = await EmployeeMembership.findOne({
    organizationId: invitation.organizationId,
    userId: user.id,
  })
  if (existingMembership) {
    // Already a member — just mark invitation as accepted
    invitation.status = 'accepted'
    await invitation.save()
    return NextResponse.json({
      message: 'You are already a member of this organization',
      organizationId: invitation.organizationId.toString(),
    })
  }

  // Create the membership
  await EmployeeMembership.create({
    organizationId: invitation.organizationId,
    userId: user.id,
  })

  // Mark invitation as accepted
  invitation.status = 'accepted'
  await invitation.save()

  // Mark the org_invitation notification for this user as read
  await Notification.updateMany(
    {
      userId: user.id,
      type: 'org_invitation',
      'metadata.invitationId': invitationId,
    },
    { isRead: true }
  )

  // Notify the org owner that the invite was accepted
  await Notification.create({
    userId: org.ownerId,
    type: 'invitation_accepted',
    title: 'Invitation accepted',
    message: `${user.name || user.email} has joined ${org.name}`,
    metadata: {
      organizationId: invitation.organizationId.toString(),
      organizationName: org.name,
    },
    isRead: false,
  })

  return NextResponse.json({
    message: `You have joined ${org.name}`,
    organizationId: invitation.organizationId.toString(),
    organizationName: org.name,
  })
}
