import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { performUptimeChecks } from '@/lib/monitoring/uptime'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Smart Health Check - Adaptive Monitoring Strategy
 *
 * This cron job implements intelligent monitoring:
 * 1. If site has recent activity (visitors/chatbot) → Skip ping (already alive)
 * 2. If last check was OK and no errors → Infrequent checks (30 min)
 * 3. If issues detected → Frequent checks (5 min)
 * 4. Drastically reduces monitoring costs vs constant pinging
 */

export async function GET(request: Request) {
  try {
    // Security check
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-change-in-production'

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[SMART HEALTH] Starting adaptive health checks...', new Date().toISOString())

    const supabase = await createClient()

    // Fetch all websites
    const { data: websites } = await supabase
      .from('websites')
      .select('*')
      .order('name')

    if (!websites || websites.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No websites to check',
        timestamp: new Date().toISOString()
      })
    }

    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

    const healthCheckDecisions = []
    const sitesToCheck = []

    for (const website of websites) {
      const decision = {
        website_id: website.id,
        website_name: website.name,
        domain: website.domain,
        action: 'skip',
        reason: '',
        should_check: false
      }

      // 1. Check for recent user activity (last 1 hour)
      const { count: recentActivityCount } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('website_id', website.id)
        .gte('created_at', oneHourAgo.toISOString())

      if (recentActivityCount && recentActivityCount > 0) {
        decision.action = 'skip'
        decision.reason = `Active users detected (${recentActivityCount} events in last hour)`
        decision.should_check = false
        healthCheckDecisions.push(decision)
        continue
      }

      // 2. Check for recent errors (last 1 hour)
      const { count: recentErrorCount } = await supabase
        .from('error_logs')
        .select('*', { count: 'exact', head: true })
        .eq('website_id', website.id)
        .eq('is_resolved', false)
        .gte('created_at', oneHourAgo.toISOString())

      if (recentErrorCount && recentErrorCount > 0) {
        decision.action = 'check'
        decision.reason = `Unresolved errors detected (${recentErrorCount}), frequent monitoring needed`
        decision.should_check = true
        sitesToCheck.push(website)
        healthCheckDecisions.push(decision)
        continue
      }

      // 3. Check last uptime check status
      const { data: lastCheck } = await supabase
        .from('uptime_checks')
        .select('*')
        .eq('website_id', website.id)
        .order('checked_at', { ascending: false })
        .limit(1)
        .single()

      // If last check was down, check frequently
      if (lastCheck && !lastCheck.is_up) {
        decision.action = 'check'
        decision.reason = 'Last check showed downtime, verifying recovery'
        decision.should_check = true
        sitesToCheck.push(website)
        healthCheckDecisions.push(decision)
        continue
      }

      // If last check was within 30 minutes and was OK, skip
      if (lastCheck && lastCheck.is_up && lastCheck.checked_at) {
        const lastCheckTime = new Date(lastCheck.checked_at)
        if (lastCheckTime > thirtyMinutesAgo) {
          decision.action = 'skip'
          decision.reason = 'Recent check was OK (less than 30 min ago), infrequent check sufficient'
          decision.should_check = false
          healthCheckDecisions.push(decision)
          continue
        }
      }

      // 4. Default: Check if no recent activity and no recent check
      decision.action = 'check'
      decision.reason = 'No recent activity or checks, performing health verification'
      decision.should_check = true
      sitesToCheck.push(website)
      healthCheckDecisions.push(decision)
    }

    // Perform actual uptime checks only for selected sites
    let uptimeResults: any[] = []
    if (sitesToCheck.length > 0) {
      console.log(`[SMART HEALTH] Checking ${sitesToCheck.length}/${websites.length} sites`)

      // Filter performUptimeChecks to only check specific sites
      // We'll need to modify this to accept website IDs
      uptimeResults = await performUptimeChecksForSites(sitesToCheck.map(w => w.id))
    }

    const summary = {
      total_websites: websites.length,
      sites_checked: sitesToCheck.length,
      sites_skipped: websites.length - sitesToCheck.length,
      cost_savings: `${Math.round(((websites.length - sitesToCheck.length) / websites.length) * 100)}% fewer checks`,
      reasons: {
        active_users: healthCheckDecisions.filter(d => d.reason.includes('Active users')).length,
        recent_errors: healthCheckDecisions.filter(d => d.reason.includes('errors')).length,
        last_check_ok: healthCheckDecisions.filter(d => d.reason.includes('Recent check was OK')).length,
        downtime_verification: healthCheckDecisions.filter(d => d.reason.includes('downtime')).length,
        default_check: healthCheckDecisions.filter(d => d.reason.includes('No recent activity')).length
      }
    }

    console.log('[SMART HEALTH] Summary:', summary)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      strategy: 'adaptive',
      summary,
      decisions: healthCheckDecisions,
      uptime_results: uptimeResults
    })
  } catch (error: any) {
    console.error('[SMART HEALTH] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Smart health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * Perform uptime checks for specific website IDs only
 */
async function performUptimeChecksForSites(websiteIds: string[]) {
  const supabase = await createClient()

  const { data: websites } = await supabase
    .from('websites')
    .select('*')
    .in('id', websiteIds)

  if (!websites || websites.length === 0) {
    return []
  }

  const results = []

  for (const website of websites) {
    const startTime = Date.now()

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

      const response = await fetch(`https://${website.domain}`, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Webmaster-Monitor/1.0'
        }
      })

      clearTimeout(timeout)

      const responseTime = Date.now() - startTime
      const isUp = response.ok

      // Update website status
      await supabase
        .from('websites')
        .update({
          status: isUp ? 'online' : 'degraded',
          last_checked_at: new Date().toISOString()
        })
        .eq('id', website.id)

      // Log uptime check
      await supabase.from('uptime_checks').insert({
        website_id: website.id,
        is_up: isUp,
        status_code: response.status,
        response_time: responseTime,
        checked_at: new Date().toISOString()
      })

      results.push({
        website_id: website.id,
        website_name: website.name,
        domain: website.domain,
        is_up: isUp,
        status_code: response.status,
        response_time: responseTime
      })
    } catch (error: any) {
      const responseTime = Date.now() - startTime

      // Update website status to offline
      await supabase
        .from('websites')
        .update({
          status: 'offline',
          last_checked_at: new Date().toISOString()
        })
        .eq('id', website.id)

      // Log failed check
      await supabase.from('uptime_checks').insert({
        website_id: website.id,
        is_up: false,
        status_code: null,
        response_time: responseTime,
        error_message: error.message,
        checked_at: new Date().toISOString()
      })

      results.push({
        website_id: website.id,
        website_name: website.name,
        domain: website.domain,
        is_up: false,
        error_message: error.message,
        response_time: responseTime
      })
    }
  }

  return results
}
