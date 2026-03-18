import { createClient } from '@/lib/supabase/server'

export interface BounceRateMetrics {
  bounceRate: number // percentage
  totalSessions: number
  bouncedSessions: number
}

export interface SessionDurationMetrics {
  averageDuration: number // seconds
  medianDuration: number // seconds
  formattedAverage: string // "Xm Ys"
  formattedMedian: string // "Xm Ys"
}

/**
 * Calculate bounce rate for a website
 *
 * Bounce = session with only 1 pageview OR session duration < 10 seconds
 *
 * @param websiteId - Website UUID
 * @param startDate - Start date for calculation
 * @param endDate - End date for calculation
 */
export async function calculateBounceRate(
  websiteId: string,
  startDate: Date,
  endDate: Date
): Promise<BounceRateMetrics> {
  const supabase = await createClient()

  // Get all sessions in date range
  const { data: events } = await supabase
    .from('analytics_events')
    .select('session_id, event_type, created_at')
    .eq('website_id', websiteId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at')

  if (!events || events.length === 0) {
    return {
      bounceRate: 0,
      totalSessions: 0,
      bouncedSessions: 0
    }
  }

  // Group events by session
  const sessions = events.reduce((acc, event) => {
    if (!acc[event.session_id]) {
      acc[event.session_id] = []
    }
    acc[event.session_id].push(event)
    return acc
  }, {} as Record<string, typeof events>)

  let totalSessions = 0
  let bouncedSessions = 0

  // Analyze each session
  for (const sessionEvents of Object.values(sessions)) {
    totalSessions++

    const pageviews = sessionEvents.filter(e => e.event_type === 'pageview')

    // Bounce if only 1 pageview
    if (pageviews.length === 1) {
      bouncedSessions++
      continue
    }

    // Bounce if session duration < 10 seconds
    const firstEvent = new Date(sessionEvents[0].created_at)
    const lastEvent = new Date(sessionEvents[sessionEvents.length - 1].created_at)
    const durationSeconds = (lastEvent.getTime() - firstEvent.getTime()) / 1000

    if (durationSeconds < 10) {
      bouncedSessions++
    }
  }

  const bounceRate = totalSessions > 0
    ? Math.round((bouncedSessions / totalSessions) * 100)
    : 0

  return {
    bounceRate,
    totalSessions,
    bouncedSessions
  }
}

/**
 * Calculate average and median session duration
 *
 * @param websiteId - Website UUID
 * @param startDate - Start date for calculation
 * @param endDate - End date for calculation
 */
export async function calculateSessionDuration(
  websiteId: string,
  startDate: Date,
  endDate: Date
): Promise<SessionDurationMetrics> {
  const supabase = await createClient()

  // Get all events in date range
  const { data: events } = await supabase
    .from('analytics_events')
    .select('session_id, created_at')
    .eq('website_id', websiteId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at')

  if (!events || events.length === 0) {
    return {
      averageDuration: 0,
      medianDuration: 0,
      formattedAverage: '0s',
      formattedMedian: '0s'
    }
  }

  // Group events by session and calculate duration for each
  const sessionDurations: number[] = []
  const sessions = events.reduce((acc, event) => {
    if (!acc[event.session_id]) {
      acc[event.session_id] = []
    }
    acc[event.session_id].push(event)
    return acc
  }, {} as Record<string, typeof events>)

  for (const sessionEvents of Object.values(sessions)) {
    if (sessionEvents.length < 2) continue // Skip single-event sessions

    const firstEvent = new Date(sessionEvents[0].created_at)
    const lastEvent = new Date(sessionEvents[sessionEvents.length - 1].created_at)
    const durationSeconds = (lastEvent.getTime() - firstEvent.getTime()) / 1000

    sessionDurations.push(durationSeconds)
  }

  if (sessionDurations.length === 0) {
    return {
      averageDuration: 0,
      medianDuration: 0,
      formattedAverage: '0s',
      formattedMedian: '0s'
    }
  }

  // Calculate average
  const averageDuration = Math.round(
    sessionDurations.reduce((sum, dur) => sum + dur, 0) / sessionDurations.length
  )

  // Calculate median
  const sorted = [...sessionDurations].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const medianDuration = sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : Math.round(sorted[mid])

  return {
    averageDuration,
    medianDuration,
    formattedAverage: formatDuration(averageDuration),
    formattedMedian: formatDuration(medianDuration)
  }
}

/**
 * Format duration in seconds to human-readable format
 * @param seconds - Duration in seconds
 * @returns Formatted string like "2m 34s" or "1h 5m 23s"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  }

  return `${minutes}m ${secs}s`
}

/**
 * Get comprehensive analytics metrics for a date range
 */
export async function getAnalyticsMetrics(
  websiteId: string,
  startDate: Date,
  endDate: Date
) {
  const [bounceMetrics, durationMetrics] = await Promise.all([
    calculateBounceRate(websiteId, startDate, endDate),
    calculateSessionDuration(websiteId, startDate, endDate)
  ])

  return {
    bounce: bounceMetrics,
    duration: durationMetrics
  }
}
