import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Plan from '@/models/Plan'

export async function GET() {
  try {
    await connectDB()

    const plans = await Plan.find({ isActive: true }).sort({ price: 1 })

    return NextResponse.json({
      success: true,
      data: plans,
    })
  } catch (error: any) {
    console.error('Get plans error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    )
  }
}
