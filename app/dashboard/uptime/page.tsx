import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Activity, Clock, AlertTriangle } from 'lucide-react'
import { UptimeChart } from '@/components/uptime/uptime-chart'
import { ResponseTimeChart } from '@/components/uptime/response-time-chart'
import { IncidentsList } from '@/components/uptime/incidents-list'
import { formatDistanceToNow } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function UptimePage() {
  const supabase = await createClient()

  // Fetch websites with their latest uptime status
  const { data: websites } = await supabase
    .from('websites')
    .select('*')
    .order('name')

  // Calculate overall uptime (mock for now)
  const totalWebsites = websites?.length || 0
  const onlineWebsites = websites?.filter(w => w.status === 'online').length || 0
  const uptimePercentage = totalWebsites > 0 ? ((onlineWebsites / totalWebsites) * 100).toFixed(1) : '0'

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
          value={`${uptimePercentage}%`}
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
          value="234ms"
          icon={<Clock className="h-4 w-4 text-blue-500" />}
          description="Average response time"
        />
        <StatsCard
          title="Incidents"
          value="2"
          icon={<AlertTriangle className="h-4 w-4 text-yellow-500" />}
          description="Last 7 days"
        />
      </div>

      {/* Website Status Cards */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Website Status</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {websites?.map((website) => (
            <WebsiteStatusCard key={website.id} website={website} />
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
            <UptimeChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response Time</CardTitle>
            <CardDescription>Average response time trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponseTimeChart />
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
          <IncidentsList />
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

function WebsiteStatusCard({ website }: { website: any }) {
  const isOnline = website.status === 'online'
  const lastChecked = website.last_checked_at
    ? formatDistanceToNow(new Date(website.last_checked_at), { addSuffix: true })
    : 'Never checked'

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
            <p className="font-bold text-green-600">99.9%</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Response</p>
            <p className="font-bold">234ms</p>
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
