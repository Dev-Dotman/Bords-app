import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Organization from '@/models/Organization'
import EmployeeMembership from '@/models/EmployeeMembership'
import { getAuthUser, unauthorized, badRequest } from '@/lib/api-helpers'

// GET /api/organizations — list orgs the user owns or is an employee of
export async function GET() {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  await connectDB()

  const [owned, memberships] = await Promise.all([
    Organization.find({ ownerId: user.id }).lean(),
    EmployeeMembership.find({ userId: user.id }).populate('organizationId').lean(),
  ])

  const memberOrgs = memberships
    .map((m: any) => m.organizationId)
    .filter(Boolean)

  const allOrgs = [
    ...owned.map((o: any) => ({ ...o, _id: o._id.toString(), ownerId: o.ownerId.toString(), role: 'owner' })),
    ...memberOrgs.map((o: any) => ({ ...o, _id: o._id.toString(), ownerId: o.ownerId.toString(), role: 'employee' })),
  ]

  return NextResponse.json({ organizations: allOrgs })
}

// POST /api/organizations — create a new org
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const body = await req.json()
  const { name } = body

  if (!name?.trim()) {
    return badRequest('Organization name is required')
  }

  await connectDB()

  const org = await Organization.create({
    name: name.trim(),
    ownerId: user.id,
  })

  return NextResponse.json({
    organization: {
      _id: org._id.toString(),
      name: org.name,
      ownerId: org.ownerId.toString(),
      createdAt: org.createdAt.toISOString(),
    },
  }, { status: 201 })
}
