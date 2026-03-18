import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const data = await req.json()

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
