import { createClient } from '@/lib/supabase/server'

export interface WeeklyReportData {
  websiteId: string
  websiteName: string
  domain: string
  dateRange: {
    startDate: string
    endDate: string
  }
  traffic: {
    totalPageviews: number
    uniqueVisitors: number
    avgSessionDuration: number
    bounceRate: number
    changeFromLastWeek: {
      pageviews: number
      visitors: number
    }
  }
  topPages: Array<{
    url: string
    pageviews: number
    uniqueVisitors: number
  }>
  topReferrers: Array<{
    referrer: string
    visitors: number
  }>
  performance: {
    avgPageLoadTime: number
    performanceScore: number
    coreWebVitals: {
      lcp: number
      inp: number
      cls: number
    }
  }
  seo: {
    totalClicks: number
    totalImpressions: number
    avgPosition: number
    topQueries: Array<{
      query: string
      clicks: number
      position: number
    }>
  }
  keywords: {
    totalKeywords: number
    top10Count: number
    newKeywords: number
    improvements: Array<{
      keyword: string
      oldPosition: number
      newPosition: number
      change: number
    }>
  }
  uptime: {
    uptimePercentage: number
    totalDowntime: number
    incidents: number
  }
  errors: {
    totalErrors: number
    unresolvedErrors: number
    topErrors: Array<{
      message: string
      count: number
    }>
  }
}

/**
 * Generate weekly report for a website
 */
export async function generateWeeklyReport(websiteId: string): Promise<WeeklyReportData> {
  const supabase = await createClient()

  // Calculate date ranges
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 7)

  const prevEndDate = new Date(startDate)
  const prevStartDate = new Date(prevEndDate)
  prevStartDate.setDate(prevStartDate.getDate() - 7)

  // Get website
  const { data: website } = await supabase
    .from('websites')
    .select('*')
    .eq('id', websiteId)
    .single()

  if (!website) {
    throw new Error('Website not found')
  }

  // === TRAFFIC METRICS ===
  const { data: currentEvents } = await supabase
    .from('analytics_events')
    .select('*')
    .eq('website_id', websiteId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  const { data: prevEvents } = await supabase
    .from('analytics_events')
    .select('*')
    .eq('website_id', websiteId)
    .gte('created_at', prevStartDate.toISOString())
    .lte('created_at', prevEndDate.toISOString())

  const currentPageviews = currentEvents?.filter(e => e.event_type === 'pageview').length || 0
  const prevPageviews = prevEvents?.filter(e => e.event_type === 'pageview').length || 0

  const uniqueVisitors = new Set(currentEvents?.map(e => e.session_id)).size
  const prevUniqueVisitors = new Set(prevEvents?.map(e => e.session_id)).size

  // Session duration and bounce rate
  const sessions: Record<string, any[]> = {}
  currentEvents?.forEach(event => {
    if (!sessions[event.session_id]) sessions[event.session_id] = []
    sessions[event.session_id].push(event)
  })

  let totalDuration = 0
  let bouncedSessions = 0

  for (const sessionEvents of Object.values(sessions)) {
    if (sessionEvents.length === 1) {
      bouncedSessions++
    } else {
      const first = new Date(sessionEvents[0].created_at).getTime()
      const last = new Date(sessionEvents[sessionEvents.length - 1].created_at).getTime()
      totalDuration += (last - first) / 1000
    }
  }

  const avgSessionDuration = Object.keys(sessions).length > 0
    ? totalDuration / Object.keys(sessions).length
    : 0

  const bounceRate = Object.keys(sessions).length > 0
    ? (bouncedSessions / Object.keys(sessions).length) * 100
    : 0

  // Top pages
  const pageCounts: Record<string, { views: number; visitors: Set<string> }> = {}
  currentEvents?.filter(e => e.event_type === 'pageview').forEach(event => {
    const url = event.page_url || 'unknown'
    if (!pageCounts[url]) pageCounts[url] = { views: 0, visitors: new Set() }
    pageCounts[url].views++
    pageCounts[url].visitors.add(event.session_id)
  })

  const topPages = Object.entries(pageCounts)
    .map(([url, data]) => ({
      url,
      pageviews: data.views,
      uniqueVisitors: data.visitors.size,
    }))
    .sort((a, b) => b.pageviews - a.pageviews)
    .slice(0, 10)

  // Top referrers
  const referrerCounts: Record<string, number> = {}
  currentEvents?.forEach(event => {
    if (event.referrer_url && event.referrer_url !== '') {
      referrerCounts[event.referrer_url] = (referrerCounts[event.referrer_url] || 0) + 1
    }
  })

  const topReferrers = Object.entries(referrerCounts)
    .map(([referrer, visitors]) => ({ referrer, visitors }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 10)

  // === PERFORMANCE METRICS ===
  const { data: vitals } = await supabase
    .from('performance_metrics')
    .select('*')
    .eq('website_id', websiteId)
    .gte('created_at', startDate.toISOString())

  const avgLCP = vitals?.filter(v => v.metric_name === 'LCP')
    .reduce((sum, v) => sum + Number(v.metric_value), 0) / (vitals?.filter(v => v.metric_name === 'LCP').length || 1) || 0

  const avgINP = vitals?.filter(v => v.metric_name === 'INP')
    .reduce((sum, v) => sum + Number(v.metric_value), 0) / (vitals?.filter(v => v.metric_name === 'INP').length || 1) || 0

  const avgCLS = vitals?.filter(v => v.metric_name === 'CLS')
    .reduce((sum, v) => sum + Number(v.metric_value), 0) / (vitals?.filter(v => v.metric_name === 'CLS').length || 1) || 0

  const { data: pagespeed } = await supabase
    .from('pagespeed_audits')
    .select('*')
    .eq('website_id', websiteId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // === SEO METRICS ===
  const { data: searchQueries } = await supabase
    .from('search_console_queries')
    .select('*')
    .eq('website_id', websiteId)
    .gte('date', startDate.toISOString().split('T')[0])

  const totalClicks = searchQueries?.reduce((sum, q) => sum + (q.clicks || 0), 0) || 0
  const totalImpressions = searchQueries?.reduce((sum, q) => sum + (q.impressions || 0), 0) || 0
  const avgPosition = searchQueries?.reduce((sum, q) => sum + (q.position || 0), 0) / (searchQueries?.length || 1) || 0

  const queryMap = new Map<string, any>()
  searchQueries?.forEach(q => {
    const existing = queryMap.get(q.query)
    if (!existing || q.clicks > existing.clicks) {
      queryMap.set(q.query, q)
    }
  })

  const topQueries = Array.from(queryMap.values())
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10)
    .map(q => ({
      query: q.query,
      clicks: q.clicks,
      position: q.position,
    }))

  // === KEYWORD METRICS ===
  const { data: keywords } = await supabase
    .from('keywords')
    .select('*')
    .eq('website_id', websiteId)

  const top10Count = keywords?.filter(k => k.current_position && k.current_position <= 10).length || 0

  // === UPTIME METRICS ===
  const { data: uptimeChecks } = await supabase
    .from('uptime_checks')
    .select('*')
    .eq('website_id', websiteId)
    .gte('checked_at', startDate.toISOString())

  const totalChecks = uptimeChecks?.length || 0
  const successfulChecks = uptimeChecks?.filter(c => c.is_up).length || 0
  const uptimePercentage = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 100

  // === ERROR METRICS ===
  const { data: errors } = await supabase
    .from('error_logs')
    .select('*')
    .eq('website_id', websiteId)
    .gte('created_at', startDate.toISOString())

  const unresolvedErrors = errors?.filter(e => !e.is_resolved).length || 0

  const errorCounts: Record<string, number> = {}
  errors?.forEach(error => {
    errorCounts[error.error_message] = (errorCounts[error.error_message] || 0) + 1
  })

  const topErrors = Object.entries(errorCounts)
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    websiteId,
    websiteName: website.name,
    domain: website.domain,
    dateRange: {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    },
    traffic: {
      totalPageviews: currentPageviews,
      uniqueVisitors,
      avgSessionDuration: Math.round(avgSessionDuration),
      bounceRate: Math.round(bounceRate),
      changeFromLastWeek: {
        pageviews: currentPageviews - prevPageviews,
        visitors: uniqueVisitors - prevUniqueVisitors,
      },
    },
    topPages,
    topReferrers,
    performance: {
      avgPageLoadTime: 0,
      performanceScore: pagespeed?.performance_score || 0,
      coreWebVitals: {
        lcp: Math.round(avgLCP),
        inp: Math.round(avgINP),
        cls: Math.round(avgCLS),
      },
    },
    seo: {
      totalClicks,
      totalImpressions,
      avgPosition: Math.round(avgPosition * 10) / 10,
      topQueries,
    },
    keywords: {
      totalKeywords: keywords?.length || 0,
      top10Count,
      newKeywords: 0,
      improvements: [],
    },
    uptime: {
      uptimePercentage: Math.round(uptimePercentage * 100) / 100,
      totalDowntime: 0,
      incidents: totalChecks - successfulChecks,
    },
    errors: {
      totalErrors: errors?.length || 0,
      unresolvedErrors,
      topErrors,
    },
  }
}

/**
 * Generate weekly reports for all websites
 */
export async function generateAllWeeklyReports(): Promise<WeeklyReportData[]> {
  const supabase = await createClient()

  const { data: websites } = await supabase
    .from('websites')
    .select('id')

  if (!websites) {
    return []
  }

  const reports: WeeklyReportData[] = []

  for (const website of websites) {
    try {
      const report = await generateWeeklyReport(website.id)
      reports.push(report)
    } catch (error: any) {
      console.error(`Failed to generate report for ${website.id}:`, error.message)
    }
  }

  return reports
}
