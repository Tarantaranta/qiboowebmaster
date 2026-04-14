import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Activity, Clock, AlertTriangle } from 'lucide-react'
import { UptimeChart } from '@/components/uptime/uptime-chart'
import { ResponseTimeChart } from '@/components/uptime/response-time-chart'
import { IncidentsList } from '@/components/uptime/incidents-list'
import { formatDistanceToNow } from 'date-fns'
import { getUptimeStats } from '@/lib/monitoring/uptime'

export const dynamic = 'force-dynamic'

export default async function UptimePage() {
  const supabase = createServiceRoleClient()

  // Fetch websites with their latest uptime status
  const { data: websites } = await supabase
    .from('websites')
    .select('*')
    .order('name')

  // Calculate real overall stats from last 30 days (720 hours)
  const websiteStats = await Promise.all(
    (websites || []).map(async (website) => ({
      website,
      stats: await getUptimeStats(website.id, 720)
    }))
  )

  // Aggregate stats
  const totalChecks = websiteStats.reduce((sum, ws) => sum + ws.stats.total_checks, 0)
  const totalIncidents = websiteStats.reduce((sum, ws) => sum + ws.stats.down_incidents, 0)
  const avgResponseTime = websiteStats.length > 0
    ? Math.round(websiteStats.reduce((sum, ws) => sum + ws.stats.avg_response_time, 0) / websiteStats.length)
    : 0

  // Calculate weighted average uptime
  const weightedUptime = totalChecks > 0
    ? websiteStats.reduce((sum, ws) => {
        const weight = ws.stats.total_checks / totalChecks
        return sum + (ws.stats.uptime_percentage * weight)
      }, 0)
    : 0

  const totalWebsites = websites?.length || 0
  const onlineWebsites = websites?.filter(w => w.status === 'online').length || 0

  // Calculate daily uptime data for chart (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: allChecks } = await supabase
    .from('uptime_checks')
    .select('*')
    .gte('checked_at', thirtyDaysAgo.toISOString())
    .order('checked_at', { ascending: true })

  // Group by day and calculate daily uptime percentage
  const dailyUptimeMap: Record<string, { total: number; up: number }> = {}
  const dailyResponseMap: Record<string, { total: number; sum: number }> = {}

  allChecks?.forEach((check) => {
    const date = new Date(check.checked_at).toISOString().split('T')[0]

    if (!dailyUptimeMap[date]) {
      dailyUptimeMap[date] = { total: 0, up: 0 }
    }
    dailyUptimeMap[date].total++
    if (check.is_up) dailyUptimeMap[date].up++

    if (!dailyResponseMap[date]) {
      dailyResponseMap[date] = { total: 0, sum: 0 }
    }
    dailyResponseMap[date].total++
    dailyResponseMap[date].sum += check.response_time || 0
  })

  const uptimeChartData = Object.entries(dailyUptimeMap)
    .map(([date, stats]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      uptime: stats.total > 0 ? (stats.up / stats.total) * 100 : 0
    }))
    .slice(-14) // Last 14 days for readability

  const responseTimeChartData = Object.entries(dailyResponseMap)
    .map(([date, stats]) => ({
      time: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ms: stats.total > 0 ? Math.round(stats.sum / stats.total) : 0
    }))
    .slice(-14) // Last 14 days

  // Get recent incidents (downtime periods)
  const { data: incidents } = await supabase
    .from('websites')
    .select('id, name, domain, status, downtime_started_at')
    .not('downtime_started_at', 'is', null)
    .order('downtime_started_at', { ascending: false })
    .limit(10)

  const incidentsData = incidents?.map((website) => ({
    id: website.id,
    website_name: website.name,
    website_domain: website.domain,
    started_at: website.downtime_started_at!,
    resolved_at: website.status === 'online' ? new Date().toISOString() : null,
    duration_minutes: website.status === 'online'
      ? Math.round((new Date().getTime() - new Date(website.downtime_started_at!).getTime()) / 60000)
      : undefined,
  }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Uptime Monitoring</h1>
        <p className="text-muted-foreground mt-2">
          Real-time website availability and performance monitoring
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Overall Uptime"
          value={`${weightedUptime.toFixed(1)}%`}
          icon={<Activity className="h-4 w-4 text-green-500" />}
          description="Last 30 days"
        />
        <StatsCard
          title="Online Sites"
          value={`${onlineWebsites}/${totalWebsites}`}
          icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
          description="Currently operational"
        />
        <StatsCard
          title="Avg Response"
          value={`${avgResponseTime}ms`}
          icon={<Clock className="h-4 w-4 text-blue-500" />}
          description="Average response time"
        />
        <StatsCard
          title="Incidents"
          value={totalIncidents.toString()}
          icon={<AlertTriangle className="h-4 w-4 text-yellow-500" />}
          description="Last 30 days"
        />
      </div>

      {/* Website Status Cards */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Website Status</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {websiteStats.map((ws) => (
            <WebsiteStatusCard key={ws.website.id} website={ws.website} stats={ws.stats} />
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Uptime History</CardTitle>
            <CardDescription>Last 30 days uptime percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <UptimeChart data={uptimeChartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response Time</CardTitle>
            <CardDescription>Average response time trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponseTimeChart data={responseTimeChartData} />
          </CardContent>
        </Card>
      </div>

      {/* Incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
          <CardDescription>Downtime and performance issues</CardDescription>
        </CardHeader>
        <CardContent>
          <IncidentsList incidents={incidentsData} />
        </CardContent>
      </Card>
    </div>
  )
}

function StatsCard({
  title,
  value,
  icon,
  description,
}: {
  title: string
  value: string
  icon: React.ReactNode
  description: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

function WebsiteStatusCard({ website, stats }: { website: any; stats: any }) {
  const isOnline = website.status === 'online'
  const lastChecked = website.last_checked_at
    ? formatDistanceToNow(new Date(website.last_checked_at), { addSuffix: true })
    : 'Never checked'

  const uptimeColor = stats.uptime_percentage >= 99 ? 'text-green-600' :
                      stats.uptime_percentage >= 95 ? 'text-yellow-600' :
                      'text-red-600'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{website.name}</CardTitle>
            <CardDescription className="font-mono text-xs">
              {website.domain}
            </CardDescription>
          </div>
          <Badge variant={isOnline ? 'default' : 'destructive'} className="flex items-center gap-1">
            {isOnline ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Uptime</p>
            <p className={`font-bold ${uptimeColor}`}>
              {stats.uptime_percentage.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Response</p>
            <p className="font-bold">{stats.avg_response_time}ms</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Last Check</p>
            <p className="font-bold text-xs">{lastChecked}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
