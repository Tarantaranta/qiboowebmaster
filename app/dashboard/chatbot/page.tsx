import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Users, Clock, TrendingUp } from 'lucide-react'
import { ConversationsList } from '@/components/chatbot/conversations-list'
import { ConversationStats } from '@/components/chatbot/conversation-stats'

export const dynamic = 'force-dynamic'

export default async function ChatbotPage() {
  const supabase = await createClient()

  // Fetch chatbot conversations (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: conversations } = await supabase
    .from('chatbot_conversations')
    .select('*')
    .gte('started_at', sevenDaysAgo.toISOString())
    .order('started_at', { ascending: false })

  const totalConversations = conversations?.length || 0
  const activeConversations = conversations?.filter(c => !c.last_message_at).length || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Chatbot Conversations</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and analyze chatbot interactions across all websites
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Conversations"
          value={totalConversations.toString()}
          icon={<MessageSquare className="h-4 w-4" />}
          description="Last 7 days"
        />
        <StatsCard
          title="Active Now"
          value={activeConversations.toString()}
          icon={<Users className="h-4 w-4 text-green-500" />}
          description="Currently chatting"
        />
        <StatsCard
          title="Avg. Duration"
          value="4m 23s"
          icon={<Clock className="h-4 w-4" />}
          description="Average conversation time"
        />
        <StatsCard
          title="Resolution Rate"
          value="87%"
          icon={<TrendingUp className="h-4 w-4 text-green-500" />}
          description="Successfully resolved"
        />
      </div>

      {/* Conversation Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Conversation Trends</CardTitle>
          <CardDescription>Daily conversation volume over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ConversationStats />
        </CardContent>
      </Card>

      {/* Conversations List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Conversations</CardTitle>
          <CardDescription>
            Latest chatbot interactions from all websites
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConversationsList conversations={conversations || []} />
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
