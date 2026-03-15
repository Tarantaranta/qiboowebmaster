'use client'

import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export function ConversationsList({ conversations }: { conversations: any[] }) {
  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-lg">No conversations yet</p>
        <p className="text-sm mt-1">Chatbot conversations will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
        >
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-sm text-muted-foreground">
                {conversation.session_id?.substring(0, 8)}...
              </span>
              <Badge variant="outline">
                {conversation.messages?.length || 0} messages
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Started {formatDistanceToNow(new Date(conversation.started_at), { addSuffix: true })}
            </p>
            {conversation.user_info?.country && (
              <p className="text-xs text-muted-foreground">
                📍 {conversation.user_info.country}
              </p>
            )}
          </div>
          <Link
            href={`/dashboard/chatbot/${conversation.id}`}
            className="text-primary hover:underline flex items-center gap-1 text-sm"
          >
            View
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      ))}
    </div>
  )
}
