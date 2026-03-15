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
  Tablet
} from 'lucide-react'

export const dynamic = 'force-dynamic'

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
      
      {/* Device Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Cihaz Dağılımı (Bugün)</CardTitle>
          <CardDescription>Ziyaretçilerin kullandığı cihazlar</CardDescription>
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
      
      {/* More sections coming soon */}
      <Card>
        <CardHeader>
          <CardTitle>Gelişmiş Analitikler (Yakında)</CardTitle>
          <CardDescription>Google Analytics entegrasyonu ile daha fazla metrik</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>• Bounce Rate</div>
            <div>• Ortalama Session Süresi</div>
            <div>• En Popüler Sayfalar</div>
            <div>• Traffic Sources (Referrers)</div>
            <div>• Coğrafi Dağılım</div>
            <div>• User Flow</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
