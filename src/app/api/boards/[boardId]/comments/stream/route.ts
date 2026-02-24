import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import connectDB from '@/lib/mongodb'
import BoardDocument from '@/models/BoardDocument'
import Bord from '@/models/Bord'
import mongoose from 'mongoose'

/*
 * SSE stream for real-time comments.
 *
 * Instead of the client polling every 30s, a single persistent HTTP connection
 * is opened. The server checks MongoDB every 5s internally and only pushes
 * data when the comment count (or content) has changed.
 *
 * Benefits over client-side polling:
 * - One TCP connection — no repeated TLS handshakes or cookie auth per request
 * - Server controls cadence — fewer DB round-trips, push only on change
 * - Instant delivery — client sees new comments within ~5s, not 30s
 */

const SERVER_CHECK_INTERVAL = 2000 // 2s internal poll for near-real-time feel
const KEEPALIVE_INTERVAL = 25000   // 25s ping to keep connection alive

/* ─── Helper: get comment count cheaply via aggregation ─── */
async function getCommentCount(boardId: string, userId: string): Promise<number | null> {
  const oid = new mongoose.Types.ObjectId(userId)

  // Direct owner / sharedWith
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

  if (result[0]?.count != null) return result[0].count

  // Fallback: org/Bord accessList
  const bord = await Bord.findOne({
    localBoardId: boardId,
    'accessList.userId': userId,
  }).lean()

  if (bord) {
    const ownerOid = new mongoose.Types.ObjectId((bord as any).ownerId)
    const bordResult = await BoardDocument.aggregate([
      { $match: { localBoardId: boardId, owner: ownerOid } },
      { $project: { count: { $size: { $ifNull: ['$comments', []] } } } },
    ])
    if (bordResult[0]?.count != null) return bordResult[0].count
  }

  return null
}

/* ─── Helper: fetch full comments ─── */
async function fetchComments(boardId: string, userId: string) {
  // Direct owner / sharedWith
  let doc = await BoardDocument.findOne({
    localBoardId: boardId,
    $or: [
      { owner: userId },
      { 'sharedWith.userId': userId },
    ],
  })

  if (doc) return doc.comments || []

  // Fallback: org/Bord accessList
  const bord = await Bord.findOne({
    localBoardId: boardId,
    'accessList.userId': userId,
  }).lean()

  if (bord) {
    doc = await BoardDocument.findOne({
      localBoardId: boardId,
      owner: (bord as any).ownerId,
    })
    if (doc) return doc.comments || []
  }

  return null
}

/* ────────────── GET — SSE Stream ────────────── */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { boardId } = await params
  const userId = session.user.id

  await connectDB()

  // Verify access once before opening stream
  const initialCount = await getCommentCount(boardId, userId)
  if (initialCount == null) {
    return new Response('Board not found', { status: 404 })
  }

  let lastKnownCount = -1 // force initial send
  let alive = true

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      const send = (event: string, data: any) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {
          alive = false
        }
      }

      const sendPing = () => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`))
        } catch {
          alive = false
        }
      }

      // Check for changes and push if needed
      const checkAndPush = async () => {
        if (!alive) return

        try {
          const count = await getCommentCount(boardId, userId)
          if (count == null) {
            // Board no longer accessible
            send('error', { message: 'Board access lost' })
            alive = false
            controller.close()
            return
          }

          if (count !== lastKnownCount) {
            // Count changed — fetch full comments and push
            const comments = await fetchComments(boardId, userId)
            if (comments != null) {
              send('comments', { comments, count })
              lastKnownCount = count
            }
          }
        } catch (err) {
          // Silently continue — will retry next interval
          console.error('SSE check error:', err)
        }
      }

      // Send initial data immediately
      await checkAndPush()

      // Set up periodic check
      const checkInterval = setInterval(async () => {
        if (!alive) {
          clearInterval(checkInterval)
          clearInterval(keepaliveInterval)
          return
        }
        await checkAndPush()
      }, SERVER_CHECK_INTERVAL)

      // Keepalive pings to prevent proxy/CDN from closing the connection
      const keepaliveInterval = setInterval(() => {
        if (!alive) {
          clearInterval(checkInterval)
          clearInterval(keepaliveInterval)
          return
        }
        sendPing()
      }, KEEPALIVE_INTERVAL)

      // Clean up when client disconnects
      req.signal.addEventListener('abort', () => {
        alive = false
        clearInterval(checkInterval)
        clearInterval(keepaliveInterval)
        try { controller.close() } catch { /* already closed */ }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    },
  })
}
