import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Invitation from '@/models/Invitation'
import Organization from '@/models/Organization'
import User from '@/models/User'

// GET /api/invitations/by-token/[token] — fetch invitation details by token
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  await connectDB()

  const invitation = await Invitation.findOne({ token }).lean() as any
  if (!invitation) {
    return NextResponse.json(
      { error: 'Invitation not found' },
      { status: 404 }
    )
  }

  // Get org details
  const org = await Organization.findById(invitation.organizationId).lean() as any

  // Get inviter details
  const inviter = await User.findById(invitation.invitedBy)
    .select('firstName lastName email image')
    .lean() as any

  return NextResponse.json({
    invitation: {
      _id: invitation._id.toString(),
      organizationId: invitation.organizationId.toString(),
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt?.toISOString(),
      createdAt: invitation.createdAt?.toISOString(),
    },
    organization: org ? {
      _id: org._id.toString(),
      name: org.name,
    } : null,
    inviter: inviter ? {
      name: `${inviter.firstName || ''} ${inviter.lastName || ''}`.trim() || inviter.email,
      email: inviter.email,
      image: inviter.image,
    } : null,
  })
}
