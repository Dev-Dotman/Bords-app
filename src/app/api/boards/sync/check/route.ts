import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import connectDB from '@/lib/mongodb'
import BoardDocument from '@/models/BoardDocument'

/* ─── GET — Ultra-lightweight: return only boardId + contentHash ─── */
/* This endpoint exists solely for change detection.                   */
/* Payload is ~50 bytes per board vs megabytes for full board data.    */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    // Only select the 3 fields we need – indexed, fast, tiny payload
    const [owned, shared] = await Promise.all([
      BoardDocument.find({ owner: session.user.id })
        .select('localBoardId contentHash name')
        .lean(),
      BoardDocument.find({ 'sharedWith.userId': session.user.id })
        .select('localBoardId contentHash name')
        .lean(),
    ])

    const boards = [
      ...owned.map((b: any) => ({
        localBoardId: b.localBoardId,
        contentHash:  b.contentHash || '',
        name:         b.name,
      })),
      ...shared.map((b: any) => ({
        localBoardId: b.localBoardId,
        contentHash:  b.contentHash || '',
        name:         b.name,
        shared:       true,
      })),
    ]

    return NextResponse.json({ boards })
  } catch (error: any) {
    console.error('Board sync check error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
