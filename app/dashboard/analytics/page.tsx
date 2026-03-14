import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, Users, MousePointer, Clock, TrendingUp, Globe } from 'lucide-react'
import { VisitorChart } from '@/components/analytics/visitor-chart'
import { TopPagesTable } from '@/components/analytics/top-pages-table'
import { DeviceBreakdown } from '@/components/analytics/device-breakdown'
import { TrafficSources } from '@/components/analytics/traffic-sources'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const supabase = await createClient()

  // Fetch analytics data (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: totalPageviews } = await supabase
    .from('analytics_events')
    .select('id', { count: 'exact', head: true })
    .eq('event_type', 'pageview')
    .gte('created_at', sevenDaysAgo.toISOString())

  const { data: uniqueVisitors } = await supabase
    .from('analytics_events')
    .select('session_id')
    .eq('event_type', 'pageview')
    .gte('created_at', sevenDaysAgo.toISOString())

  const uniqueCount = new Set(uniqueVisitors?.map(v => v.session_id) || []).size

  // Average session duration (mock for now)
  const avgDuration = '2m 34s'

  // Bounce rate (mock for now)
  const bounceRate = '42%'

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
          value={(totalPageviews as any)?.count?.toString() || '0'}
          icon={<MousePointer className="h-4 w-4" />}
          description="Last 7 days"
          trend="+12.5%"
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
              <VisitorChart />
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
              <TopPagesTable />
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
              <TrafficSources />
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
              <DeviceBreakdown />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
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
