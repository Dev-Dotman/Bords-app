import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Organization from '@/models/Organization'
import Invitation from '@/models/Invitation'
import Notification from '@/models/Notification'
import { getAuthUser, unauthorized, notFound, forbidden } from '@/lib/api-helpers'

// DELETE /api/organizations/[orgId]/invitations/[invitationId] — revoke a pending invitation
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; invitationId: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { orgId, invitationId } = await params
  await connectDB()

  const org = await Organization.findById(orgId).lean()
  if (!org) return notFound('Organization')
  if (org.ownerId.toString() !== user.id) return forbidden()

  const invitation = await Invitation.findOne({
    _id: invitationId,
    organizationId: orgId,
    status: 'pending',
  })
  if (!invitation) return notFound('Invitation')

  // Delete the invitation
  await invitation.deleteOne()

  // Also remove any pending org_invitation notification for this invitation
  await Notification.deleteMany({
    'metadata.invitationId': invitationId,
    type: 'org_invitation',
    isRead: false,
  })

  return NextResponse.json({ success: true })
}
