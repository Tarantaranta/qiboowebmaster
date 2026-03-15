import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, TrendingUp, Users, MessageSquare, Globe, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { formatRelativeTime } from '@/lib/utils'
import { AddWebsiteDialog } from '@/components/dashboard/add-website-dialog'
import { WebsiteActions } from '@/components/dashboard/website-actions'

interface Website {
  id: string
  name: string
  domain: string
  status: 'online' | 'offline' | 'degraded' | 'unknown'
  description: string
  last_checked_at: string | null
  stats?: {
    visitors: number
    errors: number
    uptime: number | null
  }
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch all websites
  const { data: websites } = await supabase
    .from('websites')
    .select('*')
    .order('name')

  // Get today's date range
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Fetch today's visitors (unique sessions with pageview events)
  const { data: todayVisitors } = await supabase
    .from('analytics_events')
    .select('session_id')
    .eq('event_type', 'pageview')
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString())

  const uniqueVisitorsToday = todayVisitors ? new Set(todayVisitors.map(v => v.session_id)).size : 0

  // Fetch active chatbot conversations (last 24 hours)
  const last24Hours = new Date()
  last24Hours.setHours(last24Hours.getHours() - 24)

  const { count: activeChatbotCount } = await supabase
    .from('chatbot_conversations')
    .select('*', { count: 'exact', head: true })
    .gte('last_message_at', last24Hours.toISOString())

  // Fetch stats per website
  const websiteStats = await Promise.all(
    (websites || []).map(async (website) => {
      // Get today's visitors for this website
      const { data: siteVisitors } = await supabase
        .from('analytics_events')
        .select('session_id')
        .eq('website_id', website.id)
        .eq('event_type', 'pageview')
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())

      const visitorCount = siteVisitors ? new Set(siteVisitors.map(v => v.session_id)).size : 0

      // Get unresolved errors count (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { count: errorCount } = await supabase
        .from('error_logs')
        .select('*', { count: 'exact', head: true })
        .eq('website_id', website.id)
        .eq('is_resolved', false)
        .gte('created_at', sevenDaysAgo.toISOString())

      // Get uptime percentage (last 7 days)
      const { data: uptimeChecks } = await supabase
        .from('uptime_checks')
        .select('is_up')
        .eq('website_id', website.id)
        .gte('checked_at', sevenDaysAgo.toISOString())

      let uptimePercentage = null
      if (uptimeChecks && uptimeChecks.length > 0) {
        const upCount = uptimeChecks.filter(c => c.is_up).length
        uptimePercentage = Math.round((upCount / uptimeChecks.length) * 100)
      }

      return {
        ...website,
        stats: {
          visitors: visitorCount,
          errors: errorCount || 0,
          uptime: uptimePercentage
        }
      }
    })
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Genel Bakış</h1>
          <p className="text-muted-foreground mt-2">
            Tüm websitelerinizin durumunu ve performansını görüntüleyin
          </p>
        </div>
        <AddWebsiteDialog />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Toplam Website"
          value={websites?.length.toString() || '0'}
          icon={<Globe className="h-4 w-4" />}
          description="Aktif izlenen siteler"
        />
        <StatsCard
          title="Online"
          value={websites?.filter(w => w.status === 'online').length.toString() || '0'}
          icon={<Activity className="h-4 w-4 text-green-500" />}
          description="Çalışan siteler"
          trend="positive"
        />
        <StatsCard
          title="Bugünkü Ziyaretçi"
          value={uniqueVisitorsToday.toString()}
          icon={<Users className="h-4 w-4 text-blue-500" />}
          description={uniqueVisitorsToday > 0 ? "Unique visitors bugün" : "Henüz veri yok"}
        />
        <StatsCard
          title="Aktif Sohbet"
          value={(activeChatbotCount || 0).toString()}
          icon={<MessageSquare className="h-4 w-4 text-purple-500" />}
          description="Son 24 saatte"
        />
      </div>

      {/* Websites Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Websiteleriniz ({websites?.length || 0})</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {websiteStats?.map((website) => (
            <WebsiteCard key={website.id} website={website} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Hızlı Başlangıç</CardTitle>
          <CardDescription>
            Dashboard'unuzu kullanmaya başlamak için bu adımları tamamlayın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <QuickAction
            title="Uptime Monitoring'i Başlat"
            description="Websitelerinizin çalışma durumunu otomatik kontrol edin"
            href="/dashboard/settings"
            badge="Yakında"
          />
          <QuickAction
            title="Analytics Script'i Ekle"
            description="Ziyaretçi istatistiklerini toplamak için tracking kodu ekleyin"
            href="/dashboard/settings"
            badge="Yakında"
          />
          <QuickAction
            title="Telegram Bot Kur"
            description="Anında bildirimler almak için Telegram botunu yapılandırın"
            href="/dashboard/settings"
            badge="Yakında"
          />
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
  trend,
}: {
  title: string
  value: string
  icon: React.ReactNode
  description: string
  trend?: 'positive' | 'negative'
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

function WebsiteCard({ website }: { website: Website }) {
  const statusConfig = {
    online: { color: 'success', label: 'Online', icon: Activity },
    offline: { color: 'destructive', label: 'Offline', icon: AlertCircle },
    degraded: { color: 'warning', label: 'Degraded', icon: AlertCircle },
    unknown: { color: 'secondary', label: 'Unknown', icon: Clock },
  } as const

  const config = statusConfig[website.status]
  const StatusIcon = config.icon

  return (
    <Card className="hover:shadow-lg transition-all duration-200 group relative">
      <div className="absolute top-4 right-4 z-10">
        <WebsiteActions
          websiteId={website.id}
          websiteName={website.name}
          domain={website.domain}
        />
      </div>
      <Link href={`/dashboard/sites/${website.domain}`}>
        <CardHeader>
          <div className="flex items-start justify-between pr-8">
            <div className="space-y-1 flex-1">
              <CardTitle className="group-hover:text-primary transition-colors">
                {website.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Globe className="h-3 w-3" />
                {website.domain}
              </CardDescription>
            </div>
            <Badge variant={config.color as any} className="flex items-center gap-1">
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{website.description}</p>
            <div className="grid grid-cols-3 gap-4 pt-3 border-t">
              <div className="text-center">
                <p className={`text-2xl font-bold ${website.stats?.uptime !== null ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {website.stats?.uptime !== null ? `${website.stats.uptime}%` : '--'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Uptime</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{website.stats?.visitors || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Bugün</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${(website.stats?.errors || 0) > 0 ? 'text-red-600' : ''}`}>
                  {website.stats?.errors || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Hata</p>
              </div>
            </div>
            {website.last_checked_at && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                <Clock className="h-3 w-3" />
                Son kontrol: {formatRelativeTime(website.last_checked_at)}
              </p>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}

function QuickAction({
  title,
  description,
  href,
  badge,
}: {
  title: string
  description: string
  href: string
  badge?: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
    >
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {badge && (
        <Badge variant="secondary" className="text-xs">
          {badge}
        </Badge>
      )}
    </Link>
  )
}
