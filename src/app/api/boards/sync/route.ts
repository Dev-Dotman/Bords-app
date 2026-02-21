import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import connectDB from '@/lib/mongodb'
import BoardDocument from '@/models/BoardDocument'
import Workspace from '@/models/Workspace'
import Bord from '@/models/Bord'
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
    reminders:    board.reminders    || [],
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
    const { localBoardId, name, board, workspaceId, organizationId, contextType } = body

    if (!localBoardId || !name || !board) {
      return NextResponse.json({ error: 'Missing localBoardId, name, or board data' }, { status: 400 })
    }

    const contentHash = computeContentHash(board)

    // Resolve workspace if not provided (auto-assign to personal workspace)
    let resolvedWorkspaceId = workspaceId || null
    let resolvedContextType = contextType || 'personal'
    if (!resolvedWorkspaceId) {
      const personalWs = await Workspace.findOne({
        ownerId: session.user.id,
        type: 'personal',
      })
      if (personalWs) resolvedWorkspaceId = personalWs._id
    }

    // Build the $set payload (shared between owner and editor paths)
    const $setPayload: Record<string, any> = {
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
      reminders:    board.reminders    || [],
      // Settings
      connectionLineSettings: board.connectionLineSettings || {},
      gridSettings:           board.gridSettings           || {},
      themeSettings:          board.themeSettings           || {},
      zIndexData:             board.zIndexData              || { counter: 0, entries: [] },
      // ID arrays
      itemIds: board.itemIds || {},
      contentHash,
      lastSyncedAt: new Date(),
    }

    // Check if a doc already exists for this board (by any owner)
    let doc = await BoardDocument.findOne({ localBoardId })

    if (!doc || doc.owner.toString() === session.user.id) {
      // Owner path — upsert (handles both new boards and existing ones)
      doc = await BoardDocument.findOneAndUpdate(
        { owner: session.user.id, localBoardId },
        {
          $set: {
            ...$setPayload,
            workspaceId:    resolvedWorkspaceId,
            organizationId: organizationId || null,
            contextType:    resolvedContextType,
          },
          $setOnInsert: {
            owner: session.user.id,
            localBoardId,
            visibility: 'private',
            sharedWith: [],
          },
        },
        { upsert: true, new: true }
      )
    } else {
      // Not the owner — check if user has edit access via Bord accessList
      const bord = await Bord.findOne({
        localBoardId,
        'accessList.userId': session.user.id,
      }).lean()

      if (!bord) {
        return NextResponse.json({ error: 'Not authorized to sync this board' }, { status: 403 })
      }

      const entry = (bord.accessList as any[]).find(
        (a: any) => (a.userId?.toString() || a.toString()) === session.user.id
      )
      if (entry?.permission !== 'edit') {
        return NextResponse.json({ error: 'View-only access — cannot sync changes' }, { status: 403 })
      }

      // Editor path — update the owner's BoardDocument (don't change workspace/org metadata)
      doc = await BoardDocument.findOneAndUpdate(
        { owner: bord.ownerId, localBoardId },
        { $set: $setPayload },
        { new: true }
      )

      if (!doc) {
        return NextResponse.json({ error: 'Board document not found' }, { status: 404 })
      }
    }

    return NextResponse.json({
      message: 'Board synced to cloud',
      boardDocId: doc!._id.toString(),
      contentHash: doc!.contentHash,
      lastSyncedAt: doc!.lastSyncedAt,
    })
  } catch (error: any) {
    console.error('Board sync save error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
