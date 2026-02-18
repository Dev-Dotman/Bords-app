import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import connectDB from '@/lib/mongodb'
import BoardDocument from '@/models/BoardDocument'

/* ────────────── GET — Load ALL user boards with full data ────────────── */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    // Fetch all boards owned by user (full documents)
    const owned = await BoardDocument.find({ owner: session.user.id })
      .sort({ updatedAt: -1 })
      .lean()

    // Fetch boards shared with the user (full documents)
    const shared = await BoardDocument.find({ 'sharedWith.userId': session.user.id })
      .sort({ updatedAt: -1 })
      .lean()

    // Map to include permission info
    const ownedBoards = owned.map((doc: any) => ({
      ...doc,
      _id: doc._id.toString(),
      owner: doc.owner.toString(),
      permission: 'owner' as const,
    }))

    const sharedBoards = shared.map((doc: any) => {
      const entry = doc.sharedWith?.find(
        (s: any) => s.userId?.toString() === session.user.id
      )
      return {
        ...doc,
        _id: doc._id.toString(),
        owner: doc.owner.toString(),
        permission: (entry?.permission as 'view' | 'edit') || 'view',
      }
    })

    return NextResponse.json({
      boards: [...ownedBoards, ...sharedBoards],
      count: ownedBoards.length + sharedBoards.length,
    })
  } catch (error: any) {
    console.error('Board sync load-all error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
