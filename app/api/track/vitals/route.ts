import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Track Core Web Vitals metrics
 *
 * Metrics tracked:
 * - LCP (Largest Contentful Paint) - Loading performance
 * - INP (Interaction to Next Paint) - Interactivity (replaced FID in 2024)
 * - CLS (Cumulative Layout Shift) - Visual stability
 * - TTFB (Time to First Byte) - Server response time
 * - FCP (First Contentful Paint) - First paint time
 */
export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const data = await request.json()
    const {
      siteId, // domain or UUID
      url,
      metric, // name of the metric (LCP, INP, CLS, TTFB, FCP)
      value, // metric value
      rating, // good, needs-improvement, poor
      delta, // change since last measurement
      id, // unique metric ID
      navigationType, // navigate, reload, back-forward, prerender
      ...metadata
    } = data

    if (!siteId || !metric || value === undefined) {
      return NextResponse.json(
        { error: 'siteId, metric, and value are required' },
        { status: 400 }
      )
    }

    // Find website by domain (siteId can be domain or UUID)
    let websiteId = siteId

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

    // Insert performance metric
    const { error } = await supabase.from('performance_metrics').insert({
      website_id: websiteId,
      page_url: url,
      metric_name: metric,
      metric_value: value,
      rating: rating || null,
      delta: delta || null,
      metric_id: id || null,
      navigation_type: navigationType || null,
      metadata: {
        ...metadata,
        user_agent: request.headers.get('user-agent') || null
      }
    })

    if (error) {
      console.error('Failed to insert performance metric:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`📊 Web Vital: ${metric} = ${value} (${rating}) for ${url}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Web Vitals tracking error:', error)
    return NextResponse.json(
      { error: error.message || 'Tracking failed' },
      { status: 500 }
    )
  }
}
