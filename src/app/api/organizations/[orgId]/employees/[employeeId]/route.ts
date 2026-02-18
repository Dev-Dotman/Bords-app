import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Organization from '@/models/Organization'
import EmployeeMembership from '@/models/EmployeeMembership'
import { getAuthUser, unauthorized, notFound, forbidden } from '@/lib/api-helpers'

// DELETE /api/organizations/[orgId]/employees/[employeeId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; employeeId: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { orgId, employeeId } = await params
  await connectDB()

  const org = await Organization.findById(orgId).lean()
  if (!org) return notFound('Organization')
  if (org.ownerId.toString() !== user.id) return forbidden()

  const membership = await EmployeeMembership.findOneAndDelete({
    _id: employeeId,
    organizationId: orgId,
  })

  if (!membership) return notFound('Employee membership')

  return NextResponse.json({ success: true })
}
