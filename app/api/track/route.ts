import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const data = await request.json()
    const {
      siteId,
      eventType,
      sessionId,
      url,
      referrer,
      userAgent,
      deviceType,
      timestamp,
      pageTitle,
      clickType,
      targetUrl,
      linkText,
      eventName,
      timeOnPage,
      scrollDepth,
      ...customData
    } = data

    if (!siteId || !eventType) {
      return NextResponse.json(
        { error: 'siteId and eventType are required' },
        { status: 400 }
      )
    }

    // Get IP address for geo-location
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown'

    // TODO: Get country from IP (use a free geo-IP service or database)
    const country = null

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

    // Insert analytics event
    const { error } = await supabase.from('analytics_events').insert({
      website_id: websiteId,
      event_type: eventType,
      page_url: url,
      referrer: referrer || null,
      user_agent: userAgent,
      ip_address: ip,
      country: country,
      device_type: deviceType,
      session_id: sessionId,
      metadata: {
        pageTitle,
        clickType,
        targetUrl,
        linkText,
        eventName,
        timeOnPage,
        scrollDepth,
        ...customData
      },
      created_at: timestamp || new Date().toISOString()
    })

    if (error) {
      console.error('Failed to insert analytics event:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Analytics tracking error:', error)
    return NextResponse.json(
      { error: error.message || 'Tracking failed' },
      { status: 500 }
    )
  }
}
