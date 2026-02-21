import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Workspace from '@/models/Workspace'
import Organization from '@/models/Organization'
import EmployeeMembership from '@/models/EmployeeMembership'
import { getAuthUser, unauthorized, badRequest } from '@/lib/api-helpers'

/**
 * GET /api/workspaces
 * Returns both workspaces for the current user (personal + org_container).
 * Auto-provisions them if they don't exist yet.
 * Includes orgs the user owns AND orgs where the user is an employee/member.
 */
export async function GET() {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  await connectDB()

  // Auto-provision workspaces if missing
  const existing = await Workspace.find({ ownerId: user.id })

  let personal = existing.find(w => w.type === 'personal')
  let orgContainer = existing.find(w => w.type === 'organization_container')

  if (!personal) {
    personal = await Workspace.create({
      ownerId: user.id,
      type: 'personal',
      name: 'Personal',
    })
  }

  if (!orgContainer) {
    orgContainer = await Workspace.create({
      ownerId: user.id,
      type: 'organization_container',
      name: 'Organizations',
    })
  }

  // Fetch owned orgs + orgs where user is an employee/member
  const [ownedOrgs, memberships] = await Promise.all([
    Organization.find({ ownerId: user.id }).sort({ createdAt: -1 }).lean(),
    EmployeeMembership.find({ userId: user.id }).populate('organizationId').lean(),
  ])

  // Extract member orgs from populated memberships
  const memberOrgs = memberships
    .map((m: any) => m.organizationId)
    .filter(Boolean)

  // Deduplicate: owned orgs first, then member orgs (skip if already in owned)
  const ownedIds = new Set(ownedOrgs.map(o => o._id.toString()))
  const allOrgs = [
    ...ownedOrgs.map(o => ({
      _id: o._id,
      name: o.name,
      ownerId: o.ownerId,
      isOwner: true,
    })),
    ...memberOrgs
      .filter((o: any) => !ownedIds.has(o._id.toString()))
      .map((o: any) => ({
        _id: o._id,
        name: o.name,
        ownerId: o.ownerId,
        isOwner: false,
      })),
  ]

  return NextResponse.json({
    workspaces: {
      personal: {
        _id: personal._id,
        type: personal.type,
        name: personal.name,
      },
      organizationContainer: {
        _id: orgContainer._id,
        type: orgContainer.type,
        name: orgContainer.name,
        organizations: allOrgs,
      },
    },
  })
}

/**
 * PUT /api/workspaces
 * Update workspace name (personal workspace only).
 */
export async function PUT(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { workspaceId, name } = await req.json()
  if (!workspaceId || !name?.trim()) {
    return badRequest('workspaceId and name are required')
  }

  await connectDB()

  const workspace = await Workspace.findOne({
    _id: workspaceId,
    ownerId: user.id,
  })

  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  workspace.name = name.trim()
  await workspace.save()

  return NextResponse.json({ workspace })
}
