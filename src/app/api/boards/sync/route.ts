import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import connectDB from '@/lib/mongodb'
import BoardDocument from '@/models/BoardDocument'
import crypto from 'crypto'

/* ── Fast content hash for change detection ── */
function computeContentHash(board: any): string {
  // Hash only the content fields that matter for change detection
  const payload = JSON.stringify({
    checklists:   board.checklists   || [],
    kanbanBoards: board.kanbanBoards || [],
    stickyNotes:  board.stickyNotes  || [],
    mediaItems:   board.mediaItems   || [],
    textElements: board.textElements || [],
    drawings:     board.drawings     || [],
    comments:     board.comments     || [],
    connections:  board.connections  || [],
    itemIds:      board.itemIds      || {},
    bg:           [board.backgroundImage, board.backgroundColor, board.backgroundOverlay, board.backgroundOverlayColor, board.backgroundBlurLevel],
    settings:     [board.connectionLineSettings, board.gridSettings, board.themeSettings],
    zIndex:       board.zIndexData   || {},
  })
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 16)
}

/* ────────────── GET — List all boards for current user ────────────── */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    // Boards owned by user + boards shared with user
    const [owned, shared] = await Promise.all([
      BoardDocument.find({ owner: session.user.id })
        .select('localBoardId name visibility contentHash lastSyncedAt createdAt updatedAt')
        .sort({ updatedAt: -1 })
        .lean(),
      BoardDocument.find({ 'sharedWith.userId': session.user.id })
        .select('localBoardId name visibility contentHash owner lastSyncedAt createdAt updatedAt sharedWith')
        .sort({ updatedAt: -1 })
        .lean(),
    ])

    return NextResponse.json({ owned, shared })
  } catch (error: any) {
    console.error('Board sync list error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/* ────────────── POST — Sync (save) a board to cloud ────────────── */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await req.json()
    const { localBoardId, name, board } = body

    if (!localBoardId || !name || !board) {
      return NextResponse.json({ error: 'Missing localBoardId, name, or board data' }, { status: 400 })
    }

    const contentHash = computeContentHash(board)

    // Upsert: create or update
    const doc = await BoardDocument.findOneAndUpdate(
      { owner: session.user.id, localBoardId },
      {
        $set: {
          name,
          // Background
          backgroundImage:        board.backgroundImage || null,
          backgroundColor:        board.backgroundColor || null,
          backgroundOverlay:      board.backgroundOverlay || false,
          backgroundOverlayColor: board.backgroundOverlayColor || null,
          backgroundBlurLevel:    board.backgroundBlurLevel || null,
          // Content
          checklists:   board.checklists   || [],
          kanbanBoards: board.kanbanBoards || [],
          stickyNotes:  board.stickyNotes  || [],
          mediaItems:   board.mediaItems   || [],
          textElements: board.textElements || [],
          drawings:     board.drawings     || [],
          comments:     board.comments     || [],
          connections:  board.connections  || [],
          // Settings
          connectionLineSettings: board.connectionLineSettings || {},
          gridSettings:           board.gridSettings           || {},
          themeSettings:          board.themeSettings           || {},
          zIndexData:             board.zIndexData              || { counter: 0, entries: [] },
          // ID arrays
          itemIds: board.itemIds || {},
          contentHash,
          lastSyncedAt: new Date(),
        },
        $setOnInsert: {
          owner: session.user.id,
          localBoardId,
          visibility: 'private',
          shareToken: null,
          sharedWith: [],
        },
      },
      { upsert: true, new: true }
    )

    return NextResponse.json({
      message: 'Board synced to cloud',
      boardDocId: doc._id.toString(),
      contentHash: doc.contentHash,
      lastSyncedAt: doc.lastSyncedAt,
    })
  } catch (error: any) {
    console.error('Board sync save error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
