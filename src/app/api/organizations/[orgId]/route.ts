import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Organization from '@/models/Organization'
import { getAuthUser, unauthorized, notFound, forbidden, badRequest } from '@/lib/api-helpers'

// GET /api/organizations/[orgId]
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
  if (org.ownerId.toString() !== user.id) return forbidden()

  return NextResponse.json({
    organization: { ...org, _id: org._id.toString(), ownerId: org.ownerId.toString() },
  })
}

// PUT /api/organizations/[orgId]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { orgId } = await params
  const body = await req.json()

  if (!body.name?.trim()) return badRequest('Name is required')

  await connectDB()

  const org = await Organization.findById(orgId)
  if (!org) return notFound('Organization')
  if (org.ownerId.toString() !== user.id) return forbidden()

  org.name = body.name.trim()
  await org.save()

  return NextResponse.json({
    organization: { _id: org._id.toString(), name: org.name, ownerId: org.ownerId.toString() },
  })
}

// DELETE /api/organizations/[orgId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { orgId } = await params
  await connectDB()

  const org = await Organization.findById(orgId)
  if (!org) return notFound('Organization')
  if (org.ownerId.toString() !== user.id) return forbidden()

  await org.deleteOne()

  return NextResponse.json({ success: true })
}
