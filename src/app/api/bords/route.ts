import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Bord from '@/models/Bord'
import Organization from '@/models/Organization'
import BordMember from '@/models/BordMember'
import { getAuthUser, unauthorized, badRequest } from '@/lib/api-helpers'

// GET /api/bords — list bords the user owns or is a member of
export async function GET() {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  await connectDB()

  const [owned, memberships] = await Promise.all([
    Bord.find({ ownerId: user.id }).lean(),
    BordMember.find({ userId: user.id }).populate('bordId').lean(),
  ])

  const memberBords = memberships
    .map((m: any) => m.bordId)
    .filter(Boolean)

  const allBords = [
    ...owned.map((b: any) => ({
      ...b,
      _id: b._id.toString(),
      organizationId: b.organizationId.toString(),
      ownerId: b.ownerId.toString(),
      lastPublishedAt: b.lastPublishedAt?.toISOString() || null,
      role: 'owner',
    })),
    ...memberBords.map((b: any) => ({
      ...b,
      _id: b._id.toString(),
      organizationId: b.organizationId.toString(),
      ownerId: b.ownerId.toString(),
      lastPublishedAt: b.lastPublishedAt?.toISOString() || null,
      role: 'collaborator',
    })),
  ]

  return NextResponse.json({ bords: allBords })
}

// POST /api/bords — link a local board to an org (creates server-side Bord reference)
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const body = await req.json()
  const { organizationId, localBoardId, title } = body

  if (!organizationId || !localBoardId || !title?.trim()) {
    return badRequest('organizationId, localBoardId, and title are required')
  }

  await connectDB()

  // Verify org ownership
  const org = await Organization.findById(organizationId).lean()
  if (!org || org.ownerId.toString() !== user.id) {
    return badRequest('Invalid organization')
  }

  // Check if already linked
  const existing = await Bord.findOne({ organizationId, localBoardId }).lean()
  if (existing) {
    return NextResponse.json({
      bord: {
        _id: existing._id.toString(),
        organizationId: existing.organizationId.toString(),
        localBoardId: existing.localBoardId,
        title: existing.title,
        ownerId: existing.ownerId.toString(),
        lastPublishedAt: existing.lastPublishedAt?.toISOString() || null,
      },
    })
  }

  const bord = await Bord.create({
    organizationId,
    localBoardId,
    title: title.trim(),
    ownerId: user.id,
  })

  return NextResponse.json({
    bord: {
      _id: bord._id.toString(),
      organizationId: bord.organizationId.toString(),
      localBoardId: bord.localBoardId,
      title: bord.title,
      ownerId: bord.ownerId.toString(),
      lastPublishedAt: null,
    },
  }, { status: 201 })
}
