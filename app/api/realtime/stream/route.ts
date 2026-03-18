import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Server-Sent Events endpoint for real-time analytics
 * Streams live visitor data every 5 seconds
 */
export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        )
      }

      const fetchAndSend = async () => {
        try {
          const supabase = await createClient()
          const now = new Date()

          // Active visitors: sessions with events in the last 5 minutes
          const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
          const { data: recentEvents } = await supabase
            .from('analytics_events')
            .select('session_id, page_url, event_type, country, device_type, referrer, created_at, website_id')
            .gte('created_at', fiveMinutesAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(200)

          if (!recentEvents) {
            sendEvent({ activeVisitors: 0, recentPageviews: [], activePages: [], countries: [] })
            return
          }

          // Get website info for display
          const websiteIds = [...new Set(recentEvents.map(e => e.website_id))]
          const { data: websites } = await supabase
            .from('websites')
            .select('id, domain, name')
            .in('id', websiteIds)

          const websiteMap = (websites || []).reduce((map, w) => {
            map[w.id] = w
            return map
          }, {} as Record<string, { id: string; domain: string; name: string }>)

          // Count active visitors (unique sessions)
          const activeSessions = new Set(recentEvents.map(e => e.session_id))

          // Recent pageviews (last 20)
          const recentPageviews = recentEvents
            .filter(e => e.event_type === 'pageview')
            .slice(0, 20)
            .map(e => ({
              page: e.page_url,
              country: e.country || 'Unknown',
              device: e.device_type || 'unknown',
              domain: websiteMap[e.website_id]?.domain || 'unknown',
              timestamp: e.created_at,
              referrer: e.referrer || 'direct',
            }))

          // Active pages (pages being viewed right now)
          const pageCounts: Record<string, number> = {}
          recentEvents
            .filter(e => e.event_type === 'pageview')
            .forEach(e => {
              const key = e.page_url || 'Unknown'
              pageCounts[key] = (pageCounts[key] || 0) + 1
            })

          const activePages = Object.entries(pageCounts)
            .map(([page, count]) => ({ page, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)

          // Country breakdown
          const countryCounts: Record<string, number> = {}
          recentEvents.forEach(e => {
            const country = e.country || 'Unknown'
            countryCounts[country] = (countryCounts[country] || 0) + 1
          })

          const countries = Object.entries(countryCounts)
            .map(([country, count]) => ({ country, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)

          // Device breakdown
          const deviceCounts: Record<string, number> = {}
          recentEvents.forEach(e => {
            const device = e.device_type || 'unknown'
            deviceCounts[device] = (deviceCounts[device] || 0) + 1
          })

          const devices = Object.entries(deviceCounts)
            .map(([device, count]) => ({ device, count }))
            .sort((a, b) => b.count - a.count)

          sendEvent({
            activeVisitors: activeSessions.size,
            recentPageviews,
            activePages,
            countries,
            devices,
            timestamp: now.toISOString(),
          })
        } catch (error) {
          console.error('Realtime stream error:', error)
          sendEvent({ error: 'Failed to fetch data' })
        }
      }

      // Send initial data immediately
      await fetchAndSend()

      // Then poll every 5 seconds
      const interval = setInterval(fetchAndSend, 5000)

      // Clean up when the connection is closed
      const cleanup = () => {
        clearInterval(interval)
        try {
          controller.close()
        } catch {
          // Already closed
        }
      }

      // Timeout after 5 minutes to prevent zombie connections
      setTimeout(cleanup, 5 * 60 * 1000)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
