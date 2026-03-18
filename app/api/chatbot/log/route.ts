import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Chatbot Logging API
 *
 * Usage from your chatbot:
 *
 * // When conversation starts
 * POST /api/chatbot/log
 * {
 *   "siteId": "website-id",
 *   "sessionId": "unique-session-id",
 *   "action": "start",
 *   "userInfo": {
 *     "ip": "1.2.3.4",
 *     "userAgent": "...",
 *     "country": "TR"
 *   }
 * }
 *
 * // When message is sent
 * POST /api/chatbot/log
 * {
 *   "siteId": "website-id",
 *   "sessionId": "session-id",
 *   "action": "message",
 *   "message": {
 *     "role": "user" | "assistant",
 *     "content": "message content",
 *     "timestamp": "2024-01-01T00:00:00Z"
 *   }
 * }
 *
 * // When conversation ends
 * POST /api/chatbot/log
 * {
 *   "siteId": "website-id",
 *   "sessionId": "session-id",
 *   "action": "end"
 * }
 */

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const data = await request.json()
    const { siteId, sessionId, action, message, userInfo } = data

    if (!siteId || !sessionId || !action) {
      return NextResponse.json(
        { error: 'siteId, sessionId, and action are required' },
        { status: 400 }
      )
    }

    if (action === 'start') {
      // Create new conversation
      const { error } = await supabase.from('chatbot_conversations').insert({
        website_id: siteId,
        session_id: sessionId,
        messages: [],
        user_info: userInfo || {},
        started_at: new Date().toISOString(),
        last_message_at: new Date().toISOString()
      })

      if (error) {
        console.error('Failed to create conversation:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: 'conversation_created' })

    } else if (action === 'message') {
      // Add message to existing conversation
      if (!message || !message.role || !message.content) {
        return NextResponse.json(
          { error: 'message object with role and content is required' },
          { status: 400 }
        )
      }

      // Get existing conversation
      const { data: conversation, error: fetchError } = await supabase
        .from('chatbot_conversations')
        .select('messages')
        .eq('website_id', siteId)
        .eq('session_id', sessionId)
        .single()

      if (fetchError) {
        // Conversation doesn't exist, create it
        const { error: createError } = await supabase
          .from('chatbot_conversations')
          .insert({
            website_id: siteId,
            session_id: sessionId,
            messages: [message],
            user_info: {},
            started_at: new Date().toISOString(),
            last_message_at: new Date().toISOString()
          })

        if (createError) {
          return NextResponse.json({ error: createError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, action: 'conversation_created_with_message' })
      }

      // Append message
      const messages = (conversation.messages as any[]) || []
      messages.push({
        role: message.role,
        content: message.content,
        timestamp: message.timestamp || new Date().toISOString()
      })

      const { error: updateError } = await supabase
        .from('chatbot_conversations')
        .update({
          messages,
          message_count: messages.length,
          last_message_at: new Date().toISOString()
        })
        .eq('website_id', siteId)
        .eq('session_id', sessionId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: 'message_added' })

    } else if (action === 'end') {
      // Mark conversation as ended (just update last_message_at)
      const { error } = await supabase
        .from('chatbot_conversations')
        .update({
          last_message_at: new Date().toISOString()
        })
        .eq('website_id', siteId)
        .eq('session_id', sessionId)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: 'conversation_ended' })

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use: start, message, or end' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Chatbot logging error:', error)
    return NextResponse.json(
      { error: error.message || 'Logging failed' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve conversations
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const siteId = searchParams.get('siteId')
  const sessionId = searchParams.get('sessionId')

  if (!siteId) {
    return NextResponse.json(
      { error: 'siteId is required' },
      { status: 400 }
    )
  }

  try {
    let query = supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('website_id', siteId)
      .order('last_message_at', { ascending: false })

    if (sessionId) {
      query = query.eq('session_id', sessionId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ conversations: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
