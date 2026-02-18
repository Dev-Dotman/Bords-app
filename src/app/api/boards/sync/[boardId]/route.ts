import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import connectDB from '@/lib/mongodb'
import BoardDocument from '@/models/BoardDocument'

/* ────────────── GET — Load a single board from cloud ────────────── */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { boardId } = await params
    await connectDB()

    // Find by owner + localBoardId
    const doc = await BoardDocument.findOne({
      localBoardId: boardId,
      $or: [
        { owner: session.user.id },
        { 'sharedWith.userId': session.user.id },
      ],
    }).lean()

    if (!doc) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    // Check permission for shared boards
    const isOwner = doc.owner.toString() === session.user.id
    let permission: 'owner' | 'view' | 'edit' = 'owner'
    if (!isOwner) {
      const entry = doc.sharedWith?.find(
        (s: any) => s.userId?.toString() === session.user.id
      )
      permission = (entry?.permission as 'view' | 'edit') || 'view'
    }

    return NextResponse.json({ board: doc, permission })
  } catch (error: any) {
    console.error('Board sync load error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/* ────────────── DELETE — Remove a board from cloud ────────────── */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { boardId } = await params
    await connectDB()

    const result = await BoardDocument.findOneAndDelete({
      owner: session.user.id,
      localBoardId: boardId,
    })

    if (!result) {
      return NextResponse.json({ error: 'Board not found or not owned by you' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Board removed from cloud' })
  } catch (error: any) {
    console.error('Board sync delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
