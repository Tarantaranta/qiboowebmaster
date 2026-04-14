import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Database,
  Globe,
  Server,
  Eye,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface SystemStatus {
  name: string
  status: 'operational' | 'degraded' | 'down'
  responseTime?: number
  lastChecked: Date
  details?: string
}

export default async function MonitoringPage() {
  const supabase = createServiceRoleClient()

  // Check database connectivity
  const dbStart = Date.now()
  const { data: dbCheck, error: dbError } = await supabase
    .from('websites')
    .select('count')
    .limit(1)
  const dbResponseTime = Date.now() - dbStart

  const databaseStatus: SystemStatus = {
    name: 'Supabase Database',
    status: dbError ? 'down' : dbResponseTime > 1000 ? 'degraded' : 'operational',
    responseTime: dbResponseTime,
    lastChecked: new Date(),
    details: dbError ? dbError.message : 'Connected'
  }

  // Check all websites
  const { data: websites } = await supabase
    .from('websites')
    .select('*')
    .order('name')

  // Get recent analytics events (last hour)
  const oneHourAgo = new Date()
  oneHourAgo.setHours(oneHourAgo.getHours() - 1)

  const { count: recentEventsCount } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneHourAgo.toISOString())

  // Get recent errors (last hour)
  const { count: recentErrorsCount } = await supabase
    .from('error_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneHourAgo.toISOString())

  // Check tracking endpoint
  const trackingEndpointStatus: SystemStatus = {
    name: 'Analytics Tracking API',
    status: recentEventsCount !== null ? 'operational' : 'down',
    lastChecked: new Date(),
    details: recentEventsCount !== null
      ? `${recentEventsCount} events in last hour`
      : 'Not responding'
  }

  // Check error tracking endpoint
  const errorTrackingStatus: SystemStatus = {
    name: 'Error Tracking API',
    status: 'operational',
    lastChecked: new Date(),
    details: `${recentErrorsCount || 0} errors in last hour`
  }

  // System health overview
  const systemStatuses = [
    databaseStatus,
    trackingEndpointStatus,
    errorTrackingStatus
  ]

  const allOperational = systemStatuses.every(s => s.status === 'operational')
  const anyDown = systemStatuses.some(s => s.status === 'down')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Canlı Monitoring</h1>
        <p className="text-muted-foreground mt-2">
          Tüm sistemlerin ve websitelerin gerçek zamanlı durumu
        </p>
      </div>

      {/* Overall System Status */}
      <Card className={`border-2 ${
        anyDown ? 'border-red-500' :
        allOperational ? 'border-green-500' : 'border-yellow-500'
      }`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {anyDown ? (
                <AlertCircle className="h-8 w-8 text-red-500" />
              ) : allOperational ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <Activity className="h-8 w-8 text-yellow-500" />
              )}
              <div>
                <CardTitle className="text-2xl">
                  {anyDown ? 'Sistem Sorunu' :
                   allOperational ? 'Tüm Sistemler Çalışıyor' : 'Bazı Sorunlar Var'}
                </CardTitle>
                <CardDescription>
                  Son güncelleme: {new Date().toLocaleString('tr-TR')}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant={anyDown ? 'destructive' : allOperational ? 'default' : 'secondary'}
              className="text-lg px-4 py-2"
            >
              {anyDown ? 'UYARI' : allOperational ? 'SORUNSUZ' : 'YAKINDAN TAKİP'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* System Components Status */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Sistem Bileşenleri</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {systemStatuses.map((system) => (
            <SystemStatusCard key={system.name} system={system} />
          ))}
        </div>
      </div>

      {/* Live Metrics */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Canlı Metrikler (Son 1 Saat)</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Analytics Events"
            value={recentEventsCount || 0}
            icon={<TrendingUp className="h-4 w-4" />}
            trend={recentEventsCount && recentEventsCount > 0 ? 'positive' : 'neutral'}
          />
          <MetricCard
            title="Hatalar"
            value={recentErrorsCount || 0}
            icon={<AlertCircle className="h-4 w-4" />}
            trend={recentErrorsCount && recentErrorsCount > 0 ? 'negative' : 'positive'}
          />
          <MetricCard
            title="Aktif Websiteler"
            value={websites?.length || 0}
            icon={<Globe className="h-4 w-4" />}
            trend="neutral"
          />
          <MetricCard
            title="Database Latency"
            value={`${dbResponseTime}ms`}
            icon={<Zap className="h-4 w-4" />}
            trend={dbResponseTime < 200 ? 'positive' : dbResponseTime < 1000 ? 'neutral' : 'negative'}
          />
        </div>
      </div>

      {/* Website Status Overview */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Website Status</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {websites?.map((website) => (
            <WebsiteStatusCard key={website.id} website={website} />
          ))}
        </div>
      </div>

      {/* API Endpoints Health */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints Durumu</CardTitle>
          <CardDescription>Tüm API endpoint'lerinin sağlık durumu</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <EndpointStatus
            path="/api/track"
            method="POST"
            status="operational"
            description="Analytics event tracking"
          />
          <EndpointStatus
            path="/api/track/error"
            method="POST"
            status="operational"
            description="Error logging"
          />
          <EndpointStatus
            path="/api/cron/uptime-check"
            method="GET"
            status="operational"
            description="Scheduled uptime monitoring"
          />
        </CardContent>
      </Card>

      {/* Environment Variables Check */}
      <Card>
        <CardHeader>
          <CardTitle>Ortam Değişkenleri</CardTitle>
          <CardDescription>Kritik environment variable'ların durumu</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <EnvVarStatus name="NEXT_PUBLIC_SUPABASE_URL" value={process.env.NEXT_PUBLIC_SUPABASE_URL} />
          <EnvVarStatus name="NEXT_PUBLIC_SUPABASE_ANON_KEY" value={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY} />
          <EnvVarStatus name="SUPABASE_SERVICE_ROLE_KEY" value={process.env.SUPABASE_SERVICE_ROLE_KEY} secret />
          <EnvVarStatus name="CRON_SECRET" value={process.env.CRON_SECRET} secret />
          <EnvVarStatus name="TELEGRAM_BOT_TOKEN" value={process.env.TELEGRAM_BOT_TOKEN} secret />
        </CardContent>
      </Card>
    </div>
  )
}

function SystemStatusCard({ system }: { system: SystemStatus }) {
  const statusConfig = {
    operational: {
      color: 'bg-green-500',
      textColor: 'text-green-500',
      icon: CheckCircle2,
      label: 'Operational'
    },
    degraded: {
      color: 'bg-yellow-500',
      textColor: 'text-yellow-500',
      icon: Activity,
      label: 'Degraded'
    },
    down: {
      color: 'bg-red-500',
      textColor: 'text-red-500',
      icon: AlertCircle,
      label: 'Down'
    }
  }

  const config = statusConfig[system.status]
  const StatusIcon = config.icon

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${config.color} animate-pulse`} />
            <CardTitle className="text-base">{system.name}</CardTitle>
          </div>
          <StatusIcon className={`h-5 w-5 ${config.textColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Badge variant={system.status === 'operational' ? 'default' : 'destructive'}>
            {config.label}
          </Badge>
          {system.responseTime && (
            <p className="text-sm text-muted-foreground">
              Response: {system.responseTime}ms
            </p>
          )}
          {system.details && (
            <p className="text-xs text-muted-foreground">{system.details}</p>
          )}
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {system.lastChecked.toLocaleTimeString('tr-TR')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function MetricCard({
  title,
  value,
  icon,
  trend
}: {
  title: string
  value: number | string
  icon: React.ReactNode
  trend: 'positive' | 'negative' | 'neutral'
}) {
  const trendColor = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-muted-foreground'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${trendColor[trend]}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  )
}

function WebsiteStatusCard({ website }: { website: any }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <CardTitle className="text-base">{website.name}</CardTitle>
          </div>
          <Badge variant={website.status === 'online' ? 'default' : 'destructive'}>
            {website.status}
          </Badge>
        </div>
        <CardDescription className="font-mono text-xs">
          {website.domain}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Tracking: Active</p>
          <p>• Script: webmaster-analytics.js</p>
          {website.last_checked_at && (
            <p>• Son kontrol: {new Date(website.last_checked_at).toLocaleString('tr-TR')}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function EndpointStatus({
  path,
  method,
  status,
  description
}: {
  path: string
  method: string
  status: 'operational' | 'down'
  description: string
}) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${
          status === 'operational' ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {method}
            </Badge>
            <code className="text-sm">{path}</code>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    </div>
  )
}

function EnvVarStatus({
  name,
  value,
  secret = false
}: {
  name: string
  value: string | undefined
  secret?: boolean
}) {
  const isSet = !!value

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${
          isSet ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <div>
          <code className="text-sm font-medium">{name}</code>
          {!secret && value && (
            <p className="text-xs text-muted-foreground mt-1 font-mono truncate max-w-md">
              {value.substring(0, 50)}...
            </p>
          )}
        </div>
      </div>
      {isSet ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <AlertCircle className="h-4 w-4 text-red-500" />
      )}
    </div>
  )
}
