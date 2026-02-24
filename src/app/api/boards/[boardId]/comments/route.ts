import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import connectDB from '@/lib/mongodb'
import BoardDocument from '@/models/BoardDocument'
import Bord from '@/models/Bord'
import User from '@/models/User'
import mongoose from 'mongoose'

/* ─── Helper: resolve board + permission for the current user ─── */
async function resolveBoardAccess(boardId: string, userId: string) {
  // Try owner or sharedWith first
  let doc = await BoardDocument.findOne({
    localBoardId: boardId,
    $or: [
      { owner: userId },
      { 'sharedWith.userId': userId },
    ],
  })

  if (doc) {
    const isOwner = doc.owner.toString() === userId
    let permission: 'owner' | 'view' | 'edit' = 'owner'
    if (!isOwner) {
      const entry = doc.sharedWith?.find(
        (s: any) => s.userId?.toString() === userId
      )
      permission = (entry?.permission as 'view' | 'edit') || 'view'
    }
    return { doc, permission }
  }

  // Fallback: check Bord accessList (org boards)
  const bord = await Bord.findOne({
    localBoardId: boardId,
    'accessList.userId': userId,
  }).lean()

  if (bord) {
    doc = await BoardDocument.findOne({
      localBoardId: boardId,
      owner: bord.ownerId,
    })
    if (doc) {
      const entry = (bord.accessList as any[]).find(
        (a: any) => (a.userId?.toString() || a.toString()) === userId
      )
      const perm = entry?.permission === 'edit' ? 'edit' : 'view'
      return { doc, permission: perm as 'owner' | 'view' | 'edit' }
    }
  }

  return null
}

/* ────────────── GET — Fetch comments for a board ────────────── */
/*
 * Supports conditional polling via ?count=N query param.
 * If the client already has N comments and the server has the same count,
 * returns 304 — no body, no bandwidth, minimal DB work.
 */
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
    const clientCount = req.nextUrl.searchParams.get('count')
    await connectDB()

    // If client sent a count, do a cheap check first
    if (clientCount != null) {
      const oid = new mongoose.Types.ObjectId(session.user.id)

      const countDoc = await BoardDocument.findOne(
        {
          localBoardId: boardId,
          $or: [
            { owner: session.user.id },
            { 'sharedWith.userId': session.user.id },
          ],
        },
        { 'comments': { $size: 0 } } // we just need the doc to exist
      ).lean()

      // Fallback for Bord accessList
      if (!countDoc) {
        const bord = await Bord.findOne({
          localBoardId: boardId,
          'accessList.userId': session.user.id,
        }).lean()
        if (!bord) {
          return NextResponse.json({ error: 'Board not found' }, { status: 404 })
        }
      }

      // Use aggregation to get just the count — avoids loading the full comment array
      const result = await BoardDocument.aggregate([
        {
          $match: {
            localBoardId: boardId,
            $or: [
              { owner: oid },
              { 'sharedWith.userId': oid },
            ],
          },
        },
        { $project: { count: { $size: { $ifNull: ['$comments', []] } } } },
      ])

      // Also check Bord-linked boards
      let serverCount = result[0]?.count
      if (serverCount == null) {
        const bord = await Bord.findOne({
          localBoardId: boardId,
          'accessList.userId': session.user.id,
        }).lean()
        if (bord) {
          const ownerOid = new mongoose.Types.ObjectId((bord as any).ownerId)
          const bordResult = await BoardDocument.aggregate([
            { $match: { localBoardId: boardId, owner: ownerOid } },
            { $project: { count: { $size: { $ifNull: ['$comments', []] } } } },
          ])
          serverCount = bordResult[0]?.count
        }
      }

      if (serverCount != null && String(serverCount) === clientCount) {
        return new NextResponse(null, { status: 304 })
      }
    }

    // Full fetch — either first load or count mismatch
    const accessResult = await resolveBoardAccess(boardId, session.user.id)
    if (!accessResult) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    const comments = accessResult.doc.comments || []
    return NextResponse.json({ comments, permission: accessResult.permission })
  } catch (error: any) {
    console.error('GET comments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/* ────────────── POST — Add a comment ────────────── */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { boardId } = await params
    const { text } = await req.json()

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 })
    }

    await connectDB()

    const result = await resolveBoardAccess(boardId, session.user.id)
    if (!result) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    // All permission levels (owner, edit, view) can add comments

    // Resolve author name from DB for accuracy
    let authorName = session.user.name || ''
    let authorEmail = session.user.email || ''
    try {
      const dbUser = await User.findById(session.user.id).lean()
      if (dbUser) {
        authorName = `${(dbUser as any).firstName || ''} ${(dbUser as any).lastName || ''}`.trim()
        authorEmail = (dbUser as any).email || authorEmail
      }
    } catch { /* use session fallback */ }

    const newComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: text.trim(),
      createdAt: new Date(),
      position: { x: 0, y: 0 },
      boardId,
      authorId: session.user.id,
      authorName: authorName || authorEmail || 'Anonymous',
      authorEmail,
    }

    // $push atomically — no race conditions
    await BoardDocument.updateOne(
      { _id: result.doc._id },
      { $push: { comments: newComment } }
    )

    return NextResponse.json({ comment: newComment }, { status: 201 })
  } catch (error: any) {
    console.error('POST comment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/* ────────────── DELETE — Remove a comment ────────────── */
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
    const { commentId } = await req.json()

    if (!commentId) {
      return NextResponse.json({ error: 'commentId is required' }, { status: 400 })
    }

    await connectDB()

    const result = await resolveBoardAccess(boardId, session.user.id)
    if (!result) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    // Check delete permission:
    // - Board owner can delete any comment
    // - Comment author can delete their own comment
    // - Org owner resolved via Bord model
    const isOwner = result.permission === 'owner'

    // Check if user is org owner via Bord document
    let isOrgOwner = false
    try {
      const bord = await Bord.findOne({ localBoardId: boardId }).lean()
      if (bord && (bord as any).ownerId?.toString() === session.user.id) {
        isOrgOwner = true
      }
    } catch { /* ignore */ }

    if (!isOwner && !isOrgOwner) {
      // Check if it's their own comment
      const comment = result.doc.comments?.find((c: any) => c.id === commentId)
      if (!comment) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
      }
      if (comment.authorId !== session.user.id && comment.authorEmail !== session.user.email) {
        return NextResponse.json({ error: 'Not authorized to delete this comment' }, { status: 403 })
      }
    }

    // $pull atomically
    await BoardDocument.updateOne(
      { _id: result.doc._id },
      { $pull: { comments: { id: commentId } } }
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE comment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
