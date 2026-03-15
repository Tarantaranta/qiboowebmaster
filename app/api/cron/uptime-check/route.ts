import { NextResponse } from 'next/server'
import { performUptimeChecks } from '@/lib/monitoring/uptime'
import { triggerDowntimeAlert, triggerRecoveryAlert } from '@/lib/alerts/trigger'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds max (for Vercel Hobby plan)

export async function GET(request: Request) {
  try {
    // Verify cron secret (security)
    const authHeader = request.headers.get('authorization')
    const cronSecret = (process.env.CRON_SECRET || 'dev-secret-change-in-production').trim()

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[CRON] Starting uptime checks...', new Date().toISOString())

    const results = await performUptimeChecks()

    // Detect status changes (for alerts)
    const statusChanges = results.filter(
      r => r.previous_status !== (r.is_up ? 'online' : 'offline')
    )

    // Trigger alerts for status changes
    const alertResults = []
    for (const change of statusChanges) {
      if (!change.is_up) {
        // Downtime detected
        console.log(`⚠️ DOWNTIME DETECTED: ${change.website_name} (${change.domain})`)
        const alertSent = await triggerDowntimeAlert(
          change.website_id,
          change.website_name,
          change.domain,
          change.error_message || 'Unknown error',
          change.response_time,
          change.status_code
        )
        alertResults.push({ type: 'downtime', website: change.website_name, alertSent })
      } else {
        // Recovery detected
        console.log(`✅ RECOVERED: ${change.website_name} (${change.domain})`)
        const alertSent = await triggerRecoveryAlert(
          change.website_id,
          change.website_name,
          change.domain,
          new Date() // TODO: Get actual downtime start time from database
        )
        alertResults.push({ type: 'recovery', website: change.website_name, alertSent })
      }
    }

    console.log('[CRON] Uptime checks completed:', {
      total: results.length,
      up: results.filter(r => r.is_up).length,
      down: results.filter(r => !r.is_up).length,
      status_changes: statusChanges.length,
      alerts_sent: alertResults.length
    })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: results.map(r => ({
        website: r.website_name,
        domain: r.domain,
        is_up: r.is_up,
        status_code: r.status_code,
        response_time: r.response_time,
        error: r.error_message
      })),
      status_changes: statusChanges.map(c => ({
        website: c.website_name,
        domain: c.domain,
        from: c.previous_status,
        to: c.is_up ? 'online' : 'offline'
      })),
      alerts: alertResults
    })
  } catch (error: any) {
    console.error('[CRON] Uptime check failed:', error)
    return NextResponse.json(
      {
        error: error.message || 'Uptime check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
