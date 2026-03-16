import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { notFound } from 'next/navigation'
import {
  Activity,
  Globe,
  Users,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Clock,
  BarChart3,
  Monitor,
  Smartphone,
  Tablet,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react'

export const dynamic = 'force-dynamic'

// Map domain to GA4 property ID env variable
function getPropertyIdForDomain(domain: string): string | null {
  const mapping: Record<string, string | undefined> = {
    'drkeremal.com': process.env.DRKEREMAL_GA4_PROPERTY_ID,
    'anityacavehouse.com': process.env.ANITYA_GA4_PROPERTY_ID,
    'gongsahne.com': process.env.GONGSAHNE_GA4_PROPERTY_ID,
    'qiboo.ai': process.env.QIBOO_GA4_PROPERTY_ID,
  }
  return mapping[domain] || null
}

// Fetch GA4 data
async function fetchGA4Data(propertyId: string) {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

    const response = await fetch(
      `${baseUrl}/api/google-analytics?propertyId=${propertyId}&startDate=7daysAgo&endDate=today`,
      { cache: 'no-store' }
    )

    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('GA4 fetch error:', error)
    return null
  }
}

export default async function SiteDashboard({ params }: { params: { domain: string } }) {
  const supabase = await createClient()

  // Fetch website by domain
  const { data: website } = await supabase
    .from('websites')
    .select('*')
    .eq('domain', params.domain)
    .single()

  if (!website) {
    notFound()
  }

  const now = new Date()
  const today = new Date(now.setHours(0, 0, 0, 0))
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const last1h = new Date(now.getTime() - 60 * 60 * 1000)

  // Fetch analytics
  const { data: todayEvents } = await supabase
    .from('analytics_events')
    .select('session_id, event_type, device_type, page_url')
    .eq('website_id', website.id)
    .gte('created_at', today.toISOString())

  const { count: totalVisitors } = await supabase
    .from('analytics_events')
    .select('session_id', { count: 'exact', head: false })
    .eq('website_id', website.id)
    .eq('event_type', 'pageview')
    .gte('created_at', last7Days.toISOString())

  // Chatbot stats
  const { count: chatbotConversations } = await supabase
    .from('chatbot_conversations')
    .select('*', { count: 'exact', head: true })
    .eq('website_id', website.id)
    .gte('created_at', last7Days.toISOString())

  // Chatbot health check - active in last hour
  const { count: activeChatbotConversations } = await supabase
    .from('chatbot_conversations')
    .select('*', { count: 'exact', head: true })
    .eq('website_id', website.id)
    .gte('last_message_at', last1h.toISOString())

  // Chatbot errors (last 24h)
  const { count: chatbotErrors } = await supabase
    .from('error_logs')
    .select('*', { count: 'exact', head: true })
    .eq('website_id', website.id)
    .eq('is_resolved', false)
    .gte('created_at', last24h.toISOString())
    .ilike('error_message', '%chatbot%')

  // Errors
  const { count: errorCount } = await supabase
    .from('error_logs')
    .select('*', { count: 'exact', head: true })
    .eq('website_id', website.id)
    .eq('is_resolved', false)
    .gte('created_at', last7Days.toISOString())

  // Device breakdown
  const deviceCounts = todayEvents?.reduce((acc: any, event) => {
    const device = event.device_type || 'unknown'
    acc[device] = (acc[device] || 0) + 1
    return acc
  }, {})

  const uniqueVisitorsToday = todayEvents
    ? new Set(todayEvents.filter(e => e.event_type === 'pageview').map(e => e.session_id)).size
    : 0

  const totalPageviews = todayEvents?.filter(e => e.event_type === 'pageview').length || 0

  // Fetch GA4 data
  const propertyId = getPropertyIdForDomain(params.domain)
  const ga4Data = propertyId ? await fetchGA4Data(propertyId) : null

  // Determine chatbot health status
  let chatbotStatus: 'active' | 'inactive' | 'error' = 'inactive'
  if (chatbotErrors && chatbotErrors > 0) {
    chatbotStatus = 'error'
  } else if (activeChatbotConversations && activeChatbotConversations > 0) {
    chatbotStatus = 'active'
  }

  const chatbotStatusConfig = {
    active: {
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
      badge: 'default' as const,
      label: 'Aktif ✓',
      description: 'Chatbot normal çalışıyor'
    },
    inactive: {
      icon: Clock,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 border-gray-200',
      badge: 'secondary' as const,
      label: 'Beklemede',
      description: 'Son 1 saatte aktivite yok'
    },
    error: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200',
      badge: 'destructive' as const,
      label: 'Hata!',
      description: `${chatbotErrors} çözülmemiş hata`
    }
  }

  const chatbotConfig = chatbotStatusConfig[chatbotStatus]
  const ChatbotIcon = chatbotConfig.icon

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <Globe className="h-8 w-8" />
            {website.name}
          </h1>
          <p className="text-muted-foreground mt-2">{website.domain}</p>
        </div>
        <Badge variant={website.status === 'online' ? 'default' : 'destructive'} className="text-lg px-4 py-2">
          {website.status}
        </Badge>
      </div>

      {/* Chatbot Health Status - Prominent */}
      <Card className={`border-2 ${chatbotConfig.bgColor}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChatbotIcon className={`h-6 w-6 ${chatbotConfig.color}`} />
              <div>
                <CardTitle className="flex items-center gap-2">
                  Chatbot Durumu
                  <Badge variant={chatbotConfig.badge}>{chatbotConfig.label}</Badge>
                </CardTitle>
                <CardDescription className="mt-1">
                  {chatbotConfig.description}
                </CardDescription>
              </div>
            </div>
            {chatbotStatus === 'active' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4 text-green-500 animate-pulse" />
                Son 1 saatte {activeChatbotConversations} etkileşim
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bugünkü Ziyaretçiler</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueVisitorsToday}</div>
            <p className="text-xs text-muted-foreground">{totalPageviews} pageview</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">7 Günlük Ziyaretçi</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVisitors || 0}</div>
            <p className="text-xs text-muted-foreground">Son 7 gün</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chatbot Konuşmaları</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chatbotConversations || 0}</div>
            <p className="text-xs text-muted-foreground">Son 7 gün</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hatalar</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${errorCount ? 'text-red-600' : ''}`}>
              {errorCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">Çözülmemiş</p>
          </CardContent>
        </Card>
      </div>

      {/* Google Analytics 4 Metrics */}
      {ga4Data?.success && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Google Analytics 4 Metrikleri
              </CardTitle>
              <CardDescription>Son 7 günlük profesyonel analitik verileri</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Aktif Kullanıcı</p>
                  <p className="text-2xl font-bold">{ga4Data.summary.totalUsers}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Oturumlar</p>
                  <p className="text-2xl font-bold">{ga4Data.summary.totalSessions}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Sayfa Görüntüleme</p>
                  <p className="text-2xl font-bold">{ga4Data.summary.totalPageViews}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Bounce Rate</p>
                  <p className="text-2xl font-bold">{(ga4Data.summary.avgBounceRate * 100).toFixed(1)}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Ort. Süre</p>
                  <p className="text-2xl font-bold">{Math.floor(ga4Data.summary.avgSessionDuration)}s</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {/* GA4 Device Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Cihaz Dağılımı (GA4)</CardTitle>
                <CardDescription>Son 7 gün - Google Analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(ga4Data.deviceBreakdown).map(([device, count]: [string, any]) => (
                    <div key={device} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {device === 'desktop' && <Monitor className="h-5 w-5 text-blue-500" />}
                        {device === 'mobile' && <Smartphone className="h-5 w-5 text-green-500" />}
                        {device === 'tablet' && <Tablet className="h-5 w-5 text-purple-500" />}
                        <span className="font-medium capitalize">{device}</span>
                      </div>
                      <span className="text-xl font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Countries */}
            <Card>
              <CardHeader>
                <CardTitle>Coğrafi Dağılım</CardTitle>
                <CardDescription>Top 10 ülke (son 7 gün)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ga4Data.topCountries.slice(0, 10).map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '📍'}</span>
                        <span className="font-medium">{item.country}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{item.users} kullanıcı</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!ga4Data?.success && (
        <Card>
          <CardHeader>
            <CardTitle>Google Analytics 4</CardTitle>
            <CardDescription>
              {propertyId
                ? 'GA4 verileri yükleniyor veya yapılandırma eksik...'
                : 'Bu site için GA4 property ID yapılandırılmamış'}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Device Breakdown (from tracking) */}
      <Card>
        <CardHeader>
          <CardTitle>Cihaz Dağılımı (Bugün - Tracking)</CardTitle>
          <CardDescription>Gerçek zamanlı tracking verisi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Monitor className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{deviceCounts?.desktop || 0}</p>
                <p className="text-xs text-muted-foreground">Desktop</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Smartphone className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{deviceCounts?.mobile || 0}</p>
                <p className="text-xs text-muted-foreground">Mobile</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Tablet className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{deviceCounts?.tablet || 0}</p>
                <p className="text-xs text-muted-foreground">Tablet</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
