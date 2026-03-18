import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    // Validation
    if (!data.websiteId || !data.pageUrl || !data.metricName || data.metricValue === undefined) {
      return NextResponse.json({
        error: 'Missing required fields: websiteId, pageUrl, metricName, metricValue'
      }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    const { websiteId, pageUrl, metricName, metricValue, rating } = data

    // Insert performance metric
    const { error } = await supabase
      .from('performance_metrics')
      .insert({
        website_id: websiteId,
        page_url: pageUrl,
        metric_name: metricName,
        metric_value: metricValue,
        rating,
        delta: data.delta,
        metric_id: data.metricId,
        navigation_type: data.navigationType,
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
