import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkErrorRateAndAlert } from '@/lib/alerts/trigger'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const data = await request.json()
    const {
      siteId,
      url,
      userAgent,
      errorMessage,
      errorType,
      stack,
      filename,
      lineno,
      colno,
      timestamp
    } = data

    if (!siteId || !errorMessage) {
      return NextResponse.json(
        { error: 'siteId and errorMessage are required' },
        { status: 400 }
      )
    }

    // Find website by domain (siteId can be domain or UUID)
    let websiteId = siteId

    // If siteId looks like a domain (contains dot), find the UUID
    if (siteId.includes('.')) {
      const { data: website } = await supabase
        .from('websites')
        .select('id')
        .eq('domain', siteId)
        .single()

      if (!website) {
        return NextResponse.json(
          { error: 'Website not found for domain: ' + siteId },
          { status: 404 }
        )
      }

      websiteId = website.id
    }

    // Insert error log
    const { error } = await supabase.from('error_logs').insert({
      website_id: websiteId,
      error_type: errorType || 'JavaScript Error',
      error_message: errorMessage,
      stack_trace: stack,
      page_url: url,
      user_agent: userAgent,
      metadata: {
        filename,
        lineno,
        colno
      },
      is_resolved: false,
      notified_via_sms: false,
      notified_via_email: false,
      created_at: timestamp || new Date().toISOString()
    })

    if (error) {
      console.error('Failed to insert error log:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Check error rate and potentially trigger alert
    // Run asynchronously, don't wait
    checkErrorRateAndAlert(websiteId).catch(err => {
      console.error('Error rate check failed:', err)
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error tracking error:', error)
    return NextResponse.json(
      { error: error.message || 'Error tracking failed' },
      { status: 500 }
    )
  }
}
