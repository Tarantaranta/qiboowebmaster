import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  Users,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  MessageCircle,
  Activity,
  BarChart3,
  Globe
} from 'lucide-react'
import Link from 'next/link'
import { formatRelativeTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface ChatbotStats {
  website_id: string
  website_name: string
  domain: string
  total_conversations: number
  total_messages: number
  active_conversations_24h: number
  avg_messages_per_conversation: number
  last_conversation_at: string | null
  error_count: number
  status: 'active' | 'inactive' | 'error'
}

export default async function ChatbotPage() {
  const supabase = await createClient()

  // Fetch all websites
  const { data: websites } = await supabase
    .from('websites')
    .select('*')
    .order('name')

  if (!websites || websites.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Chatbot Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive chatbot performance and conversation tracking
          </p>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">No websites added yet</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const now = new Date()
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Fetch chatbot stats for each website
  const chatbotStats: ChatbotStats[] = []

  for (const website of websites) {
    // Total conversations
    const { count: totalConversations } = await supabase
      .from('chatbot_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('website_id', website.id)

    // Active conversations (last 24h)
    const { count: activeConversations } = await supabase
      .from('chatbot_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('website_id', website.id)
      .gte('last_message_at', last24Hours.toISOString())

    // Total messages (from metadata)
    const { data: conversations } = await supabase
      .from('chatbot_conversations')
      .select('message_count, created_at')
      .eq('website_id', website.id)
      .order('created_at', { ascending: false })

    const totalMessages = conversations?.reduce((sum, conv) => sum + (conv.message_count || 0), 0) || 0
    const avgMessages = totalConversations && totalConversations > 0
      ? Math.round(totalMessages / totalConversations)
      : 0

    // Last conversation
    const { data: lastConversation } = await supabase
      .from('chatbot_conversations')
      .select('last_message_at')
      .eq('website_id', website.id)
      .order('last_message_at', { ascending: false })
      .limit(1)
      .single()

    // Errors (chatbot-related errors from error_logs)
    const { count: errorCount } = await supabase
      .from('error_logs')
      .select('*', { count: 'exact', head: true })
      .eq('website_id', website.id)
      .eq('is_resolved', false)
      .gte('created_at', last7Days.toISOString())
      .ilike('error_message', '%chatbot%')

    // Determine status
    let status: 'active' | 'inactive' | 'error' = 'inactive'
    if (errorCount && errorCount > 0) {
      status = 'error'
    } else if (activeConversations && activeConversations > 0) {
      status = 'active'
    }

    chatbotStats.push({
      website_id: website.id,
      website_name: website.name,
      domain: website.domain,
      total_conversations: totalConversations || 0,
      total_messages: totalMessages,
      active_conversations_24h: activeConversations || 0,
      avg_messages_per_conversation: avgMessages,
      last_conversation_at: lastConversation?.last_message_at || null,
      error_count: errorCount || 0,
      status
    })
  }

  // Global stats
  const totalConversationsAll = chatbotStats.reduce((sum, s) => sum + s.total_conversations, 0)
  const totalMessagesAll = chatbotStats.reduce((sum, s) => sum + s.total_messages, 0)
  const activeConversationsAll = chatbotStats.reduce((sum, s) => sum + s.active_conversations_24h, 0)
  const activeSites = chatbotStats.filter(s => s.status === 'active').length
  const sitesWithErrors = chatbotStats.filter(s => s.status === 'error').length

  // Recent conversations (all sites)
  const { data: recentConversations } = await supabase
    .from('chatbot_conversations')
    .select(`
      *,
      websites (
        name,
        domain
      )
    `)
    .order('last_message_at', { ascending: false })
    .limit(10)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Chatbot Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Site bazında detaylı chatbot performans ve konuşma takibi
        </p>
      </div>

      {/* Global Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Toplam Konuşma"
          value={totalConversationsAll.toString()}
          icon={<MessageSquare className="h-4 w-4" />}
          description="Tüm zamanlar"
        />
        <StatsCard
          title="Toplam Mesaj"
          value={totalMessagesAll.toString()}
          icon={<MessageCircle className="h-4 w-4 text-blue-500" />}
          description="Gönderilen mesajlar"
        />
        <StatsCard
          title="Aktif Şimdi (24s)"
          value={activeConversationsAll.toString()}
          icon={<Activity className="h-4 w-4 text-green-500" />}
          description={`${activeSites} site aktif`}
        />
        <StatsCard
          title="Hatalı Siteler"
          value={sitesWithErrors.toString()}
          icon={<AlertCircle className="h-4 w-4 text-red-500" />}
          description="Dikkat gerekli"
        />
      </div>

      {/* Per-Site Chatbot Status */}
      <Card>
        <CardHeader>
          <CardTitle>Site Bazında Chatbot Durumu</CardTitle>
          <CardDescription>
            Her chatbot için gerçek zamanlı durum ve performans metrikleri
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {chatbotStats.map((stat) => (
              <ChatbotSiteCard key={stat.website_id} stat={stat} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Conversations */}
      <Card>
        <CardHeader>
          <CardTitle>Son Konuşmalar</CardTitle>
          <CardDescription>
            Tüm websitelerden en son chatbot etkileşimleri
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentConversations && recentConversations.length > 0 ? (
            <div className="space-y-3">
              {recentConversations.map((conv) => (
                <ConversationCard key={conv.id} conversation={conv} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Henüz konuşma yok. Chatbot'lar ziyaretçilerle etkileşime hazır!
            </p>
          )}
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

function ChatbotSiteCard({ stat }: { stat: ChatbotStats }) {
  const statusConfig = {
    active: {
      color: 'bg-green-500',
      label: 'Aktif',
      icon: CheckCircle2,
      textColor: 'text-green-600'
    },
    inactive: {
      color: 'bg-gray-500',
      label: 'İnaktif',
      icon: Clock,
      textColor: 'text-gray-600'
    },
    error: {
      color: 'bg-red-500',
      label: 'Hata',
      icon: AlertCircle,
      textColor: 'text-red-600'
    }
  }

  const config = statusConfig[stat.status]
  const StatusIcon = config.icon

  return (
    <Link href={`/dashboard/sites/${stat.domain}`}>
      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-4 flex-1">
          <div className={`w-3 h-3 rounded-full ${config.color} ${stat.status === 'active' ? 'animate-pulse' : ''}`} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-semibold">{stat.website_name}</h4>
              <span className="text-xs text-muted-foreground">{stat.domain}</span>
              <Badge variant={stat.status === 'active' ? 'default' : stat.status === 'error' ? 'destructive' : 'secondary'}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-2 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Konuşmalar</p>
                <p className="font-semibold">{stat.total_conversations}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Mesajlar</p>
                <p className="font-semibold">{stat.total_messages}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Ort/Konuşma</p>
                <p className="font-semibold">{stat.avg_messages_per_conversation}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">24s Aktif</p>
                <p className={`font-semibold ${stat.active_conversations_24h > 0 ? 'text-green-600' : ''}`}>
                  {stat.active_conversations_24h}
                </p>
              </div>
            </div>
            {stat.error_count > 0 && (
              <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {stat.error_count} çözülmemiş hata
              </p>
            )}
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          {stat.last_conversation_at ? (
            <>
              Son aktivite:<br />
              {formatRelativeTime(stat.last_conversation_at)}
            </>
          ) : (
            'Henüz aktivite yok'
          )}
        </div>
      </div>
    </Link>
  )
}

function ConversationCard({ conversation }: { conversation: any }) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{conversation.websites?.name || 'Bilinmeyen Site'}</p>
            <span className="text-xs text-muted-foreground">{conversation.websites?.domain}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {conversation.message_count || 0} mesaj • Session: {conversation.session_id?.substring(0, 12)}...
          </p>
        </div>
      </div>
      <div className="text-right text-xs text-muted-foreground">
        {formatRelativeTime(conversation.last_message_at)}
      </div>
    </div>
  )
}
