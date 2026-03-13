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
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch all websites
  const { data: websites } = await supabase
    .from('websites')
    .select('*')
    .order('name')

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
          value="0"
          icon={<Users className="h-4 w-4 text-blue-500" />}
          description="Henüz veri yok"
        />
        <StatsCard
          title="Aktif Sohbet"
          value="0"
          icon={<MessageSquare className="h-4 w-4 text-purple-500" />}
          description="Chatbot konuşmaları"
        />
      </div>

      {/* Websites Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Websiteleriniz ({websites?.length || 0})</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {websites?.map((website) => (
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
            href="/settings"
            badge="Yakında"
          />
          <QuickAction
            title="Analytics Script'i Ekle"
            description="Ziyaretçi istatistiklerini toplamak için tracking kodu ekleyin"
            href="/settings"
            badge="Yakında"
          />
          <QuickAction
            title="Telegram Bot Kur"
            description="Anında bildirimler almak için Telegram botunu yapılandırın"
            href="/settings"
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
      <Link href={`/sites/${website.domain}`}>
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
                <p className="text-2xl font-bold text-green-600">--</p>
                <p className="text-xs text-muted-foreground mt-1">Uptime</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground mt-1">Ziyaretçi</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">0</p>
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
