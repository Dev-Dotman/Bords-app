import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import BoardDocument from '@/models/BoardDocument'

/* ────────────── GET — Load a public board via share token ────────────── */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    await connectDB()

    const doc = await BoardDocument.findOne({
      shareToken: token,
      visibility: 'public',
    })
      .select('-owner -sharedWith')
      .lean()

    if (!doc) {
      return NextResponse.json({ error: 'Board not found or not public' }, { status: 404 })
    }

    return NextResponse.json({ board: doc, permission: 'view' })
  } catch (error: any) {
    console.error('Public board load error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
