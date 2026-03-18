import { createClient } from '@/lib/supabase/server'

export interface FunnelStep {
  name: string
  urlPattern: string
}

export interface FunnelStepResult {
  name: string
  urlPattern: string
  visitors: number
  dropoff: number
  dropoffRate: number
  conversionRate: number
}

export interface FunnelResult {
  steps: FunnelStepResult[]
  totalEntries: number
  totalConversions: number
  overallConversionRate: number
}

export interface UserFlowPath {
  path: string[]
  count: number
}

export interface UserFlowResult {
  topPaths: UserFlowPath[]
  topEntryPages: { page: string; count: number }[]
  topExitPages: { page: string; count: number }[]
  totalSessions: number
}

/**
 * Analyze a conversion funnel for a website
 * Tracks how many visitors move through each step of the funnel
 */
export async function analyzeFunnel(
  websiteId: string,
  steps: FunnelStep[],
  startDate: Date,
  endDate: Date
): Promise<FunnelResult> {
  const supabase = await createClient()

  // Get all pageview events in date range, grouped by session
  const { data: events } = await supabase
    .from('analytics_events')
    .select('session_id, page_url, created_at')
    .eq('website_id', websiteId)
    .eq('event_type', 'pageview')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true })

  if (!events || events.length === 0) {
    return {
      steps: steps.map(s => ({
        ...s,
        visitors: 0,
        dropoff: 0,
        dropoffRate: 0,
        conversionRate: 0,
      })),
      totalEntries: 0,
      totalConversions: 0,
      overallConversionRate: 0,
    }
  }

  // Group events by session
  const sessions: Record<string, string[]> = {}
  for (const event of events) {
    if (!sessions[event.session_id]) {
      sessions[event.session_id] = []
    }
    sessions[event.session_id].push(event.page_url || '')
  }

  // For each session, check if it progresses through the funnel steps in order
  const stepCounts: number[] = new Array(steps.length).fill(0)

  for (const pages of Object.values(sessions)) {
    let stepIndex = 0

    for (const page of pages) {
      if (stepIndex >= steps.length) break

      if (matchesUrlPattern(page, steps[stepIndex].urlPattern)) {
        stepCounts[stepIndex]++
        stepIndex++
      }
    }
  }

  const totalEntries = stepCounts[0] || 0
  const totalConversions = stepCounts[steps.length - 1] || 0

  const funnelSteps: FunnelStepResult[] = steps.map((step, i) => {
    const visitors = stepCounts[i]
    const prevVisitors = i === 0 ? visitors : stepCounts[i - 1]
    const dropoff = prevVisitors - visitors
    const dropoffRate = prevVisitors > 0 ? Math.round((dropoff / prevVisitors) * 100) : 0
    const conversionRate = totalEntries > 0 ? Math.round((visitors / totalEntries) * 100) : 0

    return {
      ...step,
      visitors,
      dropoff,
      dropoffRate,
      conversionRate,
    }
  })

  return {
    steps: funnelSteps,
    totalEntries,
    totalConversions,
    overallConversionRate: totalEntries > 0
      ? Math.round((totalConversions / totalEntries) * 100)
      : 0,
  }
}

/**
 * Analyze user navigation flows across a website
 * Returns top paths, entry pages, and exit pages
 */
export async function analyzeUserFlows(
  websiteId: string,
  startDate: Date,
  endDate: Date,
  maxPathLength: number = 5
): Promise<UserFlowResult> {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('analytics_events')
    .select('session_id, page_url, created_at')
    .eq('website_id', websiteId)
    .eq('event_type', 'pageview')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true })

  if (!events || events.length === 0) {
    return {
      topPaths: [],
      topEntryPages: [],
      topExitPages: [],
      totalSessions: 0,
    }
  }

  // Group events by session, preserving order
  const sessions: Record<string, string[]> = {}
  for (const event of events) {
    if (!sessions[event.session_id]) {
      sessions[event.session_id] = []
    }
    const url = simplifyUrl(event.page_url || '')
    // Deduplicate consecutive pages (reload same page)
    const lastPage = sessions[event.session_id].at(-1)
    if (url !== lastPage) {
      sessions[event.session_id].push(url)
    }
  }

  // Count paths
  const pathCounts: Record<string, number> = {}
  const entryCounts: Record<string, number> = {}
  const exitCounts: Record<string, number> = {}

  for (const pages of Object.values(sessions)) {
    if (pages.length === 0) continue

    // Entry page
    entryCounts[pages[0]] = (entryCounts[pages[0]] || 0) + 1

    // Exit page
    const exitPage = pages[pages.length - 1]
    exitCounts[exitPage] = (exitCounts[exitPage] || 0) + 1

    // Path (truncate to maxPathLength)
    const path = pages.slice(0, maxPathLength)
    const pathKey = path.join(' -> ')
    pathCounts[pathKey] = (pathCounts[pathKey] || 0) + 1
  }

  const topPaths = Object.entries(pathCounts)
    .map(([pathStr, count]) => ({
      path: pathStr.split(' -> '),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)

  const topEntryPages = Object.entries(entryCounts)
    .map(([page, count]) => ({ page, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const topExitPages = Object.entries(exitCounts)
    .map(([page, count]) => ({ page, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    topPaths,
    topEntryPages,
    topExitPages,
    totalSessions: Object.keys(sessions).length,
  }
}

/**
 * Check if a URL matches a pattern
 * Supports exact match and wildcard (*) at the end
 */
function matchesUrlPattern(url: string, pattern: string): boolean {
  const normalized = simplifyUrl(url)

  if (pattern.endsWith('*')) {
    const prefix = pattern.slice(0, -1)
    return normalized.startsWith(prefix)
  }

  return normalized === pattern || normalized === pattern + '/'
}

/**
 * Simplify URL to path only for cleaner display
 */
function simplifyUrl(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.pathname
  } catch {
    // If not a full URL, assume it's already a path
    return url
  }
}
