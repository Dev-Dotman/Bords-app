import { NextResponse } from 'next/server'
import { checkSubscriptions } from '@/scripts/check-subscriptions'

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const result = await checkSubscriptions()

    return NextResponse.json({
      message: 'Subscription check completed',
      ...result,
    })
  } catch (error: any) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: error.message || 'Subscription check failed' },
      { status: 500 }
    )
  }
}
