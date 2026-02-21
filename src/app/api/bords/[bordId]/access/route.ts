import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Bord from '@/models/Bord'
import EmployeeMembership from '@/models/EmployeeMembership'
import User from '@/models/User'
import { getAuthUser, unauthorized, notFound, forbidden, badRequest } from '@/lib/api-helpers'

/**
 * GET /api/bords/[bordId]/access
 * Returns the current access list for a bord + all org employees (for the picker).
 * Only the bord owner can view/manage the access list.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bordId: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { bordId } = await params
  await connectDB()

  const bord = await Bord.findById(bordId).lean()
  if (!bord) return notFound('Bord')
  if (bord.ownerId.toString() !== user.id) return forbidden()

  // Get all org employees
  const memberships = await EmployeeMembership.find({
    organizationId: bord.organizationId,
  })
    .populate('userId', 'email firstName lastName image')
    .lean()

  const employees = memberships.map((m: any) => ({
    userId: m.userId._id.toString(),
    email: m.userId.email,
    firstName: m.userId.firstName,
    lastName: m.userId.lastName,
    image: m.userId.image,
  }))

  return NextResponse.json({
    accessList: (bord.accessList || []).map((entry: any) => ({
      userId: entry.userId?.toString() || entry.toString(),
      permission: entry.permission || 'view',
    })),
    employees,
  })
}

/**
 * PUT /api/bords/[bordId]/access
 * Update the access list for a bord.
 * Body: { accessList: string[] } — array of userId strings
 * Only the bord owner can update the access list.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ bordId: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { bordId } = await params
  const body = await req.json()
  const { accessList } = body

  if (!Array.isArray(accessList)) {
    return badRequest('accessList must be an array of { userId, permission } entries')
  }

  // Normalize: accept both string[] (legacy) and { userId, permission }[]
  const normalizedList = accessList.map((entry: any) => {
    if (typeof entry === 'string') return { userId: entry, permission: 'view' as const }
    return { userId: entry.userId, permission: entry.permission || 'view' }
  })

  await connectDB()

  const bord = await Bord.findById(bordId)
  if (!bord) return notFound('Bord')
  if (bord.ownerId.toString() !== user.id) return forbidden()

  // Validate all userIds are actual org employees
  const userIds = normalizedList.map((e: any) => e.userId)
  if (userIds.length > 0) {
    const validMemberships = await EmployeeMembership.find({
      organizationId: bord.organizationId,
      userId: { $in: userIds },
    }).lean()

    const validUserIds = new Set(
      validMemberships.map((m: any) => m.userId.toString())
    )

    const invalidIds = userIds.filter((id: string) => !validUserIds.has(id))
    if (invalidIds.length > 0) {
      return badRequest('Some user IDs are not members of this organization')
    }
  }

  // Validate permissions
  for (const entry of normalizedList) {
    if (!['view', 'edit'].includes(entry.permission)) {
      return badRequest('permission must be "view" or "edit"')
    }
  }

  bord.accessList = normalizedList
  await bord.save()

  return NextResponse.json({
    accessList: bord.accessList.map((entry: any) => ({
      userId: entry.userId.toString(),
      permission: entry.permission,
    })),
  })
}
