import { createClient } from '@/lib/supabase/server'

export interface UptimeCheckResult {
  website_id: string
  website_name: string
  domain: string
  is_up: boolean
  status_code: number | null
  response_time: number
  error_message: string | null
  previous_status: string
  downtime_started_at: string | null
}

export async function checkWebsiteUptime(
  websiteId: string,
  domain: string,
  websiteName: string
): Promise<UptimeCheckResult> {
  const startTime = Date.now()
  let isUp = false
  let statusCode: number | null = null
  let errorMessage: string | null = null

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'WebmasterBot/1.0 Uptime Monitor'
      }
    })

    clearTimeout(timeoutId)
    statusCode = response.status
    isUp = response.status >= 200 && response.status < 500 // 2xx, 3xx, 4xx are "up"
  } catch (error: any) {
    isUp = false
    errorMessage = error.message || 'Connection failed'

    if (error.name === 'AbortError') {
      errorMessage = 'Request timeout (>10s)'
    }
  }

  const responseTime = Date.now() - startTime

  return {
    website_id: websiteId,
    website_name: websiteName,
    domain,
    is_up: isUp,
    status_code: statusCode,
    response_time: responseTime,
    error_message: errorMessage,
    previous_status: '', // Will be filled later
    downtime_started_at: null // Will be filled later
  }
}

export async function performUptimeChecks(): Promise<UptimeCheckResult[]> {
  const supabase = await createClient()

  // Fetch all websites
  const { data: websites, error } = await supabase
    .from('websites')
    .select('id, name, domain, status, downtime_started_at')

  if (error || !websites) {
    console.error('Failed to fetch websites:', error)
    return []
  }

  // Check each website
  const results: UptimeCheckResult[] = []

  for (const website of websites) {
    const result = await checkWebsiteUptime(
      website.id,
      website.domain,
      website.name
    )
    result.previous_status = website.status
    result.downtime_started_at = website.downtime_started_at
    results.push(result)

    // Save to database
    await supabase.from('uptime_checks').insert({
      website_id: website.id,
      status_code: result.status_code,
      response_time: result.response_time,
      is_up: result.is_up,
      error_message: result.error_message,
      checked_at: new Date().toISOString()
    })

    // Update website status
    const newStatus = result.is_up ? 'online' : 'offline'
    const updateData: any = {
      status: newStatus,
      last_checked_at: new Date().toISOString()
    }

    // Track downtime start/end
    if (!result.is_up && website.status !== 'offline') {
      // Just went offline - mark downtime start
      updateData.downtime_started_at = new Date().toISOString()
    } else if (result.is_up && website.status === 'offline') {
      // Just recovered - clear downtime start
      updateData.downtime_started_at = null
    }

    await supabase
      .from('websites')
      .update(updateData)
      .eq('id', website.id)
  }

  return results
}

export async function getUptimeStats(websiteId: string, hours: number = 24) {
  const supabase = await createClient()

  const startTime = new Date()
  startTime.setHours(startTime.getHours() - hours)

  const { data, error } = await supabase
    .from('uptime_checks')
    .select('*')
    .eq('website_id', websiteId)
    .gte('checked_at', startTime.toISOString())
    .order('checked_at', { ascending: true })

  if (error || !data) {
    return {
      uptime_percentage: 0,
      avg_response_time: 0,
      total_checks: 0,
      down_incidents: 0
    }
  }

  const totalChecks = data.length
  const upChecks = data.filter(c => c.is_up).length
  const uptimePercentage = totalChecks > 0 ? (upChecks / totalChecks) * 100 : 0

  const avgResponseTime = totalChecks > 0
    ? data.reduce((sum, c) => sum + c.response_time, 0) / totalChecks
    : 0

  // Count down incidents (consecutive down checks)
  let downIncidents = 0
  let wasDown = false
  for (const check of data) {
    if (!check.is_up && !wasDown) {
      downIncidents++
      wasDown = true
    } else if (check.is_up) {
      wasDown = false
    }
  }

  return {
    uptime_percentage: Math.round(uptimePercentage * 100) / 100,
    avg_response_time: Math.round(avgResponseTime),
    total_checks: totalChecks,
    down_incidents: downIncidents,
    checks: data
  }
}
