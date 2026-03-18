import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, Users, MousePointer, Clock, TrendingUp, Globe } from 'lucide-react'
import { VisitorChart } from '@/components/analytics/visitor-chart'
import { TopPagesTable } from '@/components/analytics/top-pages-table'
import { DeviceBreakdown } from '@/components/analytics/device-breakdown'
import { TrafficSources } from '@/components/analytics/traffic-sources'
import { calculateBounceRate, calculateSessionDuration } from '@/lib/analytics/metrics'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const supabase = await createClient()

  // Fetch analytics data (last 7 days)
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 7)
  const sevenDaysAgo = startDate

  // Get total pageviews
  const { count: totalPageviews } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .eq('event_type', 'pageview')
    .gte('created_at', sevenDaysAgo.toISOString())

  // Get unique visitors (unique sessions)
  const { data: uniqueVisitors } = await supabase
    .from('analytics_events')
    .select('session_id')
    .eq('event_type', 'pageview')
    .gte('created_at', sevenDaysAgo.toISOString())

  const uniqueCount = new Set(uniqueVisitors?.map(v => v.session_id) || []).size

  // Get all events for charts and stats
  const { data: allEvents } = await supabase
    .from('analytics_events')
    .select('*')
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  // Calculate daily stats for chart
  const dailyStats = calculateDailyStats(allEvents || [])

  // Calculate top pages
  const topPages = calculateTopPages(allEvents || [])

  // Calculate device breakdown
  const deviceStats = calculateDeviceBreakdown(allEvents || [])

  // Calculate traffic sources
  const trafficSources = calculateTrafficSources(allEvents || [])

  // Calculate real bounce rate and session duration (all websites combined)
  const websites = await supabase.from('websites').select('id')
  const websiteIds = websites.data?.map(w => w.id) || []

  // Calculate metrics for all websites (we'll aggregate them)
  const metricsPromises = websiteIds.map(id =>
    Promise.all([
      calculateBounceRate(id, startDate, endDate),
      calculateSessionDuration(id, startDate, endDate)
    ])
  )

  const allMetrics = await Promise.all(metricsPromises)

  // Aggregate bounce rate (weighted average)
  const totalSessions = allMetrics.reduce((sum, [bounce]) => sum + bounce.totalSessions, 0)
  const totalBounced = allMetrics.reduce((sum, [bounce]) => sum + bounce.bouncedSessions, 0)
  const aggregateBounceRate = totalSessions > 0
    ? Math.round((totalBounced / totalSessions) * 100)
    : 0

  // Aggregate session duration (simple average of averages)
  const allDurations = allMetrics.map(([_, duration]) => duration.averageDuration).filter(d => d > 0)
  const aggregateAvgDuration = allDurations.length > 0
    ? Math.round(allDurations.reduce((sum, d) => sum + d, 0) / allDurations.length)
    : 0

  const avgDuration = allDurations.length > 0
    ? allMetrics[0][1].formattedAverage.replace(/\d+/, String(Math.floor(aggregateAvgDuration / 60))).replace(/s$/, `${aggregateAvgDuration % 60}s`)
    : '0s'

  const bounceRate = `${aggregateBounceRate}%`

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Visitor insights and traffic analytics across all websites
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Pageviews"
          value={totalPageviews?.toString() || '0'}
          icon={<MousePointer className="h-4 w-4" />}
          description="Last 7 days"
        />
        <StatsCard
          title="Unique Visitors"
          value={uniqueCount.toString()}
          icon={<Users className="h-4 w-4" />}
          description="Last 7 days"
          trend="+8.2%"
        />
        <StatsCard
          title="Avg. Session"
          value={avgDuration}
          icon={<Clock className="h-4 w-4" />}
          description="Average duration"
        />
        <StatsCard
          title="Bounce Rate"
          value={bounceRate}
          icon={<TrendingUp className="h-4 w-4" />}
          description="Last 7 days"
          trendDown
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pages">Top Pages</TabsTrigger>
          <TabsTrigger value="sources">Traffic Sources</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visitor Trend</CardTitle>
              <CardDescription>
                Daily pageviews over the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <VisitorChart data={dailyStats} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
              <CardDescription>
                Most visited pages across all websites
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TopPagesTable pages={topPages} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Sources</CardTitle>
              <CardDescription>
                Where your visitors are coming from
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrafficSources sources={trafficSources} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Device Breakdown</CardTitle>
              <CardDescription>
                Visitor device and browser distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeviceBreakdown devices={deviceStats} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper functions to process analytics data
function calculateDailyStats(events: any[]) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dailyData: Record<string, { visitors: Set<string>, pageviews: number }> = {}

  events.forEach(event => {
    if (event.event_type !== 'pageview') return

    const date = new Date(event.created_at)
    const dayName = days[date.getDay()]

    if (!dailyData[dayName]) {
      dailyData[dayName] = { visitors: new Set(), pageviews: 0 }
    }

    dailyData[dayName].visitors.add(event.session_id)
    dailyData[dayName].pageviews++
  })

  return days.map(day => ({
    date: day,
    visitors: dailyData[day]?.visitors.size || 0,
    pageviews: dailyData[day]?.pageviews || 0
  }))
}

function calculateTopPages(events: any[]) {
  const pageStats: Record<string, { views: number, visitors: Set<string> }> = {}

  events.forEach(event => {
    if (event.event_type !== 'pageview') return

    const url = event.page_url || 'Unknown'
    if (!pageStats[url]) {
      pageStats[url] = { views: 0, visitors: new Set() }
    }

    pageStats[url].views++
    pageStats[url].visitors.add(event.session_id)
  })

  return Object.entries(pageStats)
    .map(([page, stats]) => ({
      page,
      views: stats.views,
      uniqueVisitors: stats.visitors.size,
      avgTime: '2:15' // Mock for now
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10)
}

function calculateDeviceBreakdown(events: any[]) {
  const deviceCounts: Record<string, number> = {}

  events.forEach(event => {
    if (event.event_type !== 'pageview') return
    const device = event.device_type || 'unknown'
    deviceCounts[device] = (deviceCounts[device] || 0) + 1
  })

  const total = Object.values(deviceCounts).reduce((a, b) => a + b, 0)

  return Object.entries(deviceCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: name === 'desktop' ? 'hsl(var(--primary))' :
           name === 'mobile' ? 'hsl(var(--destructive))' :
           'hsl(var(--muted-foreground))'
  }))
}

function calculateTrafficSources(events: any[]) {
  const sourceCounts: Record<string, number> = {}

  events.forEach(event => {
    if (event.event_type !== 'pageview') return
    const source = event.referrer || 'direct'
    sourceCounts[source] = (sourceCounts[source] || 0) + 1
  })

  const total = Object.values(sourceCounts).reduce((a, b) => a + b, 0)

  return Object.entries(sourceCounts)
    .map(([name, visitors]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      visitors,
      percentage: total > 0 ? Math.round((visitors / total) * 100) : 0
    }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 5)
}

function StatsCard({
  title,
  value,
  icon,
  description,
  trend,
  trendDown,
}: {
  title: string
  value: string
  icon: React.ReactNode
  description: string
  trend?: string
  trendDown?: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
          {trend && (
            <span className={trendDown ? 'text-red-500 ml-2' : 'text-green-500 ml-2'}>
              {trend}
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  )
}
