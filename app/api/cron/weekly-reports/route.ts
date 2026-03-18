import { NextResponse } from 'next/server'
import { sendAllWeeklyReports } from '@/lib/reports/email-report'

export const dynamic = 'force-dynamic'

/**
 * Cron job to send weekly reports every Monday morning
 *
 * Schedule: Every Monday at 9 AM UTC
 * Vercel Cron: "0 9 * * 1"
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET?.trim()

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[CRON] Starting weekly report generation...', new Date().toISOString())

    const recipientEmail = process.env.ALERT_EMAIL_TO || process.env.ADMIN_EMAIL

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'No recipient email configured (ALERT_EMAIL_TO or ADMIN_EMAIL)' },
        { status: 400 }
      )
    }

    // Send reports for all websites
    const successCount = await sendAllWeeklyReports(recipientEmail)

    console.log(`[CRON] ✅ Weekly reports sent: ${successCount} emails`)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      recipientEmail,
      reportsSent: successCount,
    })
  } catch (error: any) {
    console.error('[CRON] Weekly report error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
