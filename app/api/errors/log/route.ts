import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const data = await req.json()

    const { websiteId, errorType, errorMessage, stackTrace, pageUrl, userAgent } = data

    // Insert error log
    const { error } = await supabase
      .from('error_logs')
      .insert({
        website_id: websiteId,
        error_type: errorType || 'JavaScript',
        error_message: errorMessage,
        stack_trace: stackTrace,
        page_url: pageUrl,
        user_agent: userAgent,
        severity: data.severity || 'medium'
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
