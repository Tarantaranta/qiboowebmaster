import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * PageSpeed Insights API Analyzer
 *
 * Analyzes a URL using Google PageSpeed Insights API
 * Free tier: 25,000 queries/day, 400 queries/100 seconds
 *
 * @see https://developers.google.com/speed/docs/insights/v5/get-started
 */
export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const { url, websiteId, strategy } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Build PageSpeed Insights API request
    const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY
    const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed')
    apiUrl.searchParams.append('url', url)
    apiUrl.searchParams.append('strategy', strategy || 'mobile') // mobile or desktop
    apiUrl.searchParams.append('category', 'performance')
    apiUrl.searchParams.append('category', 'accessibility')
    apiUrl.searchParams.append('category', 'best-practices')
    apiUrl.searchParams.append('category', 'seo')

    if (apiKey) {
      apiUrl.searchParams.append('key', apiKey)
    }

    console.log(`📊 Running PageSpeed analysis for: ${url} (${strategy || 'mobile'})`)

    // Call PageSpeed Insights API
    const response = await fetch(apiUrl.toString())

    if (!response.ok) {
      const error = await response.text()
      console.error('PageSpeed API error:', error)
      return NextResponse.json(
        { error: 'PageSpeed API failed: ' + error },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Extract scores and metrics
    const lighthouseResult = data.lighthouseResult
    const categories = lighthouseResult.categories

    const scores = {
      performance: Math.round((categories.performance?.score || 0) * 100),
      accessibility: Math.round((categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
      seo: Math.round((categories.seo?.score || 0) * 100)
    }

    // Extract Core Web Vitals from field data (real user metrics)
    const loadingExperience = data.loadingExperience
    const originLoadingExperience = data.originLoadingExperience

    const fieldMetrics = {
      lcp: loadingExperience?.metrics?.LARGEST_CONTENTFUL_PAINT_MS,
      fid: loadingExperience?.metrics?.INTERACTION_TO_NEXT_PAINT, // INP in 2024+
      cls: loadingExperience?.metrics?.CUMULATIVE_LAYOUT_SHIFT_SCORE,
      fcp: loadingExperience?.metrics?.FIRST_CONTENTFUL_PAINT_MS,
      ttfb: loadingExperience?.metrics?.EXPERIMENTAL_TIME_TO_FIRST_BYTE,
      overall_category: loadingExperience?.overall_category // FAST, AVERAGE, SLOW
    }

    // Extract lab data (Lighthouse metrics)
    const audits = lighthouseResult.audits
    const labMetrics = {
      fcp: audits['first-contentful-paint']?.numericValue,
      lcp: audits['largest-contentful-paint']?.numericValue,
      tbt: audits['total-blocking-time']?.numericValue,
      cls: audits['cumulative-layout-shift']?.numericValue,
      si: audits['speed-index']?.numericValue,
      tti: audits['interactive']?.numericValue
    }

    // Extract opportunities (performance improvements)
    const opportunities = Object.values(audits)
      .filter((audit: any) => audit.details?.type === 'opportunity' && audit.score < 1)
      .map((audit: any) => ({
        title: audit.title,
        description: audit.description,
        score: audit.score,
        numericValue: audit.numericValue,
        displayValue: audit.displayValue
      }))
      .sort((a, b) => (b.numericValue || 0) - (a.numericValue || 0))
      .slice(0, 10) // Top 10 opportunities

    // Extract diagnostics
    const diagnostics = Object.values(audits)
      .filter((audit: any) => audit.details?.type === 'debugdata' || audit.score < 0.9)
      .map((audit: any) => ({
        id: audit.id,
        title: audit.title,
        description: audit.description,
        score: audit.score,
        displayValue: audit.displayValue
      }))
      .slice(0, 10)

    const result = {
      url,
      strategy: strategy || 'mobile',
      scores,
      fieldMetrics,
      labMetrics,
      opportunities,
      diagnostics,
      fetchTime: lighthouseResult.fetchTime,
      userAgent: lighthouseResult.userAgent
    }

    // Save to database if websiteId provided
    if (websiteId) {
      await supabase.from('pagespeed_audits').insert({
        website_id: websiteId,
        url,
        strategy: strategy || 'mobile',
        performance_score: scores.performance,
        accessibility_score: scores.accessibility,
        best_practices_score: scores.bestPractices,
        seo_score: scores.seo,
        field_metrics: fieldMetrics,
        lab_metrics: labMetrics,
        opportunities,
        diagnostics,
        metadata: {
          fetchTime: result.fetchTime,
          userAgent: result.userAgent
        }
      })

      console.log(`✅ PageSpeed audit saved: ${url} - Performance: ${scores.performance}`)
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error: any) {
    console.error('PageSpeed analysis error:', error)
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to fetch latest PageSpeed audit for a website
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const websiteId = searchParams.get('websiteId')
  const url = searchParams.get('url')

  if (!websiteId && !url) {
    return NextResponse.json(
      { error: 'websiteId or url is required' },
      { status: 400 }
    )
  }

  try {
    let query = supabase
      .from('pagespeed_audits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    if (websiteId) {
      query = query.eq('website_id', websiteId)
    }

    if (url) {
      query = query.eq('url', url)
    }

    const { data, error } = await query.single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
