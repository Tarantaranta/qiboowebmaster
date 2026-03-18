import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    // Validation
    if (!data.websiteId || !data.pageUrl) {
      return NextResponse.json({
        error: 'Missing required fields: websiteId, pageUrl'
      }, { status: 400 })
    }

    const supabase = await createClient()
    const { websiteId, eventType, pageUrl, referrer, userAgent } = data

    // Insert analytics event
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        website_id: websiteId,
        event_type: eventType || 'pageview',
        page_url: pageUrl,
        referrer,
        user_agent: userAgent,
        session_id: data.sessionId || crypto.randomUUID(),
        metadata: data.metadata || {}
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
