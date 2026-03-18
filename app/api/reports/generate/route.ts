import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Generate custom report
 * POST /api/reports/generate
 *
 * Body:
 * {
 *   "websiteId": "uuid",
 *   "metrics": ["traffic", "pageviews", "seo-queries"],
 *   "dateRange": { "from": "2025-03-01", "to": "2025-03-07" },
 *   "format": "csv" | "pdf"
 * }
 */
export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const body = await request.json()
    const { websiteId, metrics, dateRange, format } = body

    if (!websiteId || !metrics || !dateRange || !format) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get website
    const { data: website } = await supabase
      .from('websites')
      .select('*')
      .eq('id', websiteId)
      .single()

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      )
    }

    const startDate = new Date(dateRange.from)
    const endDate = new Date(dateRange.to)

    // Collect report data based on selected metrics
    const reportData: any = {
      website,
      dateRange: {
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
      },
      data: {},
    }

    // Fetch data for each selected metric
    for (const metric of metrics) {
      switch (metric) {
        case 'traffic':
          const { data: events } = await supabase
            .from('analytics_events')
            .select('*')
            .eq('website_id', websiteId)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())

          const pageviews = events?.filter(e => e.event_type === 'pageview').length || 0
          const uniqueVisitors = new Set(events?.map(e => e.session_id)).size

          reportData.data.traffic = { pageviews, uniqueVisitors, events: events?.length || 0 }
          break

        case 'pageviews':
          const { data: pageviewEvents } = await supabase
            .from('analytics_events')
            .select('*')
            .eq('website_id', websiteId)
            .eq('event_type', 'pageview')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())

          const pageCounts: Record<string, number> = {}
          pageviewEvents?.forEach(e => {
            pageCounts[e.page_url || 'unknown'] = (pageCounts[e.page_url || 'unknown'] || 0) + 1
          })

          reportData.data.pageviews = Object.entries(pageCounts)
            .map(([url, count]) => ({ url, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 50)
          break

        case 'seo-queries':
          const { data: queries } = await supabase
            .from('search_console_queries')
            .select('*')
            .eq('website_id', websiteId)
            .gte('date', startDate.toISOString().split('T')[0])
            .lte('date', endDate.toISOString().split('T')[0])

          reportData.data.seoQueries = queries || []
          break

        case 'keywords':
          const { data: keywords } = await supabase
            .from('keywords')
            .select('*')
            .eq('website_id', websiteId)

          reportData.data.keywords = keywords || []
          break

        case 'performance':
          const { data: pagespeed } = await supabase
            .from('pagespeed_audits')
            .select('*')
            .eq('website_id', websiteId)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())

          reportData.data.performance = pagespeed || []
          break

        case 'core-web-vitals':
          const { data: vitals } = await supabase
            .from('performance_metrics')
            .select('*')
            .eq('website_id', websiteId)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())

          reportData.data.coreWebVitals = vitals || []
          break

        case 'uptime':
          const { data: uptime } = await supabase
            .from('uptime_checks')
            .select('*')
            .eq('website_id', websiteId)
            .gte('checked_at', startDate.toISOString())
            .lte('checked_at', endDate.toISOString())

          reportData.data.uptime = uptime || []
          break

        case 'errors':
          const { data: errors } = await supabase
            .from('error_logs')
            .select('*')
            .eq('website_id', websiteId)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())

          reportData.data.errors = errors || []
          break
      }
    }

    // Generate report based on format
    if (format === 'csv') {
      const csv = generateCSV(reportData)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="report-${website.domain}-${Date.now()}.csv"`,
        },
      })
    } else if (format === 'pdf') {
      // For PDF, return simple text for now (full PDF generation requires a library like puppeteer)
      const text = generateTextReport(reportData)
      return new NextResponse(text, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="report-${website.domain}-${Date.now()}.txt"`,
        },
      })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  } catch (error: any) {
    console.error('[Reports] Generate error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    )
  }
}

/**
 * Generate CSV from report data
 */
function generateCSV(reportData: any): string {
  const lines: string[] = []

  // Header
  lines.push(`# ${reportData.website.name} - Custom Report`)
  lines.push(`# Date Range: ${reportData.dateRange.from} to ${reportData.dateRange.to}`)
  lines.push(`# Generated: ${new Date().toISOString()}`)
  lines.push('')

  // Traffic data
  if (reportData.data.traffic) {
    lines.push('## Traffic Overview')
    lines.push('Metric,Value')
    lines.push(`Total Pageviews,${reportData.data.traffic.pageviews}`)
    lines.push(`Unique Visitors,${reportData.data.traffic.uniqueVisitors}`)
    lines.push(`Total Events,${reportData.data.traffic.events}`)
    lines.push('')
  }

  // Top pages
  if (reportData.data.pageviews) {
    lines.push('## Top Pages')
    lines.push('URL,Pageviews')
    reportData.data.pageviews.forEach((page: any) => {
      lines.push(`"${page.url}",${page.count}`)
    })
    lines.push('')
  }

  // SEO queries
  if (reportData.data.seoQueries) {
    lines.push('## Search Console Queries')
    lines.push('Query,Clicks,Impressions,CTR,Position,Date')
    reportData.data.seoQueries.slice(0, 100).forEach((query: any) => {
      lines.push(
        `"${query.query}",${query.clicks},${query.impressions},${query.ctr},${query.position},${query.date}`
      )
    })
    lines.push('')
  }

  // Keywords
  if (reportData.data.keywords) {
    lines.push('## Keywords')
    lines.push('Keyword,Current Position,Search Volume,Difficulty,Last Checked')
    reportData.data.keywords.forEach((keyword: any) => {
      lines.push(
        `"${keyword.keyword}",${keyword.current_position || 'N/A'},${keyword.search_volume || 'N/A'},${keyword.difficulty || 'N/A'},${keyword.last_checked_at || 'N/A'}`
      )
    })
    lines.push('')
  }

  // Errors
  if (reportData.data.errors) {
    lines.push('## Error Logs')
    lines.push('Error Message,Count,Severity,Resolved,Created At')
    const errorCounts: Record<string, any> = {}
    reportData.data.errors.forEach((error: any) => {
      if (!errorCounts[error.error_message]) {
        errorCounts[error.error_message] = {
          count: 0,
          severity: error.severity,
          resolved: error.is_resolved,
          createdAt: error.created_at,
        }
      }
      errorCounts[error.error_message].count++
    })
    Object.entries(errorCounts).forEach(([message, data]: [string, any]) => {
      lines.push(`"${message}",${data.count},${data.severity},${data.resolved},${data.createdAt}`)
    })
  }

  return lines.join('\n')
}

/**
 * Generate text report
 */
function generateTextReport(reportData: any): string {
  const lines: string[] = []

  lines.push('='.repeat(80))
  lines.push(`${reportData.website.name} - Custom Report`)
  lines.push(`Domain: ${reportData.website.domain}`)
  lines.push(`Date Range: ${reportData.dateRange.from} to ${reportData.dateRange.to}`)
  lines.push(`Generated: ${new Date().toLocaleString()}`)
  lines.push('='.repeat(80))
  lines.push('')

  // Traffic
  if (reportData.data.traffic) {
    lines.push('TRAFFIC OVERVIEW')
    lines.push('-'.repeat(80))
    lines.push(`Total Pageviews: ${reportData.data.traffic.pageviews.toLocaleString()}`)
    lines.push(`Unique Visitors: ${reportData.data.traffic.uniqueVisitors.toLocaleString()}`)
    lines.push(`Total Events: ${reportData.data.traffic.events.toLocaleString()}`)
    lines.push('')
  }

  // Top Pages
  if (reportData.data.pageviews) {
    lines.push('TOP PAGES')
    lines.push('-'.repeat(80))
    reportData.data.pageviews.slice(0, 10).forEach((page: any, i: number) => {
      lines.push(`${i + 1}. ${page.url} - ${page.count.toLocaleString()} views`)
    })
    lines.push('')
  }

  // Keywords
  if (reportData.data.keywords) {
    lines.push('KEYWORD RANKINGS')
    lines.push('-'.repeat(80))
    lines.push(`Total Keywords: ${reportData.data.keywords.length}`)
    const top10 = reportData.data.keywords.filter((k: any) => k.current_position && k.current_position <= 10)
    lines.push(`Top 10 Rankings: ${top10.length}`)
    lines.push('')
  }

  return lines.join('\n')
}
