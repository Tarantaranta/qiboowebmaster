import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  fetchSearchQueriesDetailed,
  fetchSearchPagesDetailed,
  formatSiteUrl,
  verifySiteAccess,
} from '@/lib/google/search-console'

export const dynamic = 'force-dynamic'

/**
 * Fetch and store Google Search Console data
 * POST /api/search-console/fetch
 *
 * Body:
 * {
 *   "websiteId": "uuid",
 *   "days": 7,
 *   "useDomainProperty": false
 * }
 */
export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const body = await request.json()
    const { websiteId, days = 7, useDomainProperty = false } = body

    if (!websiteId) {
      return NextResponse.json(
        { error: 'websiteId is required' },
        { status: 400 }
      )
    }

    // Get website
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('*')
      .eq('id', websiteId)
      .single()

    if (websiteError || !website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      )
    }

    // Format site URL for Search Console API
    const siteUrl = formatSiteUrl(website.domain, useDomainProperty)

    // Note: Skipping verifySiteAccess check because sites.get() doesn't work well with sc-domain: format
    // Access is already verified by service account permissions in Search Console

    // Calculate date range
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - 2) // GSC has 2-3 day delay
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - days)

    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    console.log(`[Search Console] Fetching data for ${website.domain} (${startDateStr} to ${endDateStr})`)

    // Fetch queries with country and device breakdown
    const queryRows = await fetchSearchQueriesDetailed(siteUrl, startDateStr, endDateStr, 5000)

    // Fetch pages with country and device breakdown
    const pageRows = await fetchSearchPagesDetailed(siteUrl, startDateStr, endDateStr, 5000)

    console.log(`[Search Console] Fetched ${queryRows.length} query rows, ${pageRows.length} page rows`)

    // Store queries in database
    let queriesInserted = 0
    if (queryRows.length > 0) {
      const queryData = queryRows.map(row => ({
        website_id: websiteId,
        query: row.keys[0] || 'unknown',
        impressions: row.impressions || 0,
        clicks: row.clicks || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
        date: endDateStr,
        country: row.keys[1] || null,
        device: row.keys[2] || null,
      }))

      console.log(`[Search Console] Attempting to insert ${queryData.length} queries...`)

      const { error: queryError, count, data: insertedData } = await supabase
        .from('search_console_queries')
        .upsert(queryData, {
          onConflict: 'website_id,query,date,country,device',
          ignoreDuplicates: false,
        })
        .select()

      console.log(`[Search Console] Upsert result - count: ${count}, data length: ${insertedData?.length}, error:`, queryError)

      if (queryError) {
        console.error('[Search Console] Query insert error:', queryError)
      } else {
        queriesInserted = insertedData?.length || count || queryData.length
      }
    }

    // Store pages in database
    let pagesInserted = 0
    if (pageRows.length > 0) {
      const pageData = pageRows.map(row => ({
        website_id: websiteId,
        page_url: row.keys[0] || 'unknown',
        impressions: row.impressions || 0,
        clicks: row.clicks || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
        date: endDateStr,
        country: row.keys[1] || null,
        device: row.keys[2] || null,
      }))

      console.log(`[Search Console] Attempting to insert ${pageData.length} pages...`)

      const { error: pageError, count, data: insertedData } = await supabase
        .from('search_console_pages')
        .upsert(pageData, {
          onConflict: 'website_id,page_url,date,country,device',
          ignoreDuplicates: false,
        })
        .select()

      console.log(`[Search Console] Upsert result - count: ${count}, data length: ${insertedData?.length}, error:`, pageError)

      if (pageError) {
        console.error('[Search Console] Page insert error:', pageError)
      } else {
        pagesInserted = insertedData?.length || count || pageData.length
      }
    }

    // Log sync
    await supabase.from('search_console_sync_log').insert({
      website_id: websiteId,
      sync_date: endDateStr,
      queries_synced: queriesInserted,
      pages_synced: pagesInserted,
      status: 'success',
    })

    console.log(`[Search Console] ✅ Sync complete: ${queriesInserted} queries, ${pagesInserted} pages`)

    return NextResponse.json({
      success: true,
      website: website.domain,
      dateRange: { startDate: startDateStr, endDate: endDateStr },
      results: {
        queries: queriesInserted,
        pages: pagesInserted,
        totalRows: queryRows.length + pageRows.length,
      },
    })
  } catch (error: any) {
    console.error('[Search Console] Fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Search Console data' },
      { status: 500 }
    )
  }
}

/**
 * Get stored Search Console data
 * GET /api/search-console/fetch?websiteId=uuid&days=7
 */
export async function GET(request: Request) {
  const supabase = await createClient()

  try {
    const { searchParams } = new URL(request.url)
    const websiteId = searchParams.get('websiteId')
    const days = parseInt(searchParams.get('days') || '7', 10)

    if (!websiteId) {
      return NextResponse.json(
        { error: 'websiteId is required' },
        { status: 400 }
      )
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get top queries
    const { data: queries } = await supabase
      .from('search_console_queries')
      .select('*')
      .eq('website_id', websiteId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('clicks', { ascending: false })
      .limit(100)

    // Get top pages
    const { data: pages } = await supabase
      .from('search_console_pages')
      .select('*')
      .eq('website_id', websiteId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('clicks', { ascending: false })
      .limit(100)

    // Aggregate stats
    const totalClicks = (queries || []).reduce((sum, q) => sum + (q.clicks || 0), 0)
    const totalImpressions = (queries || []).reduce((sum, q) => sum + (q.impressions || 0), 0)
    const avgCTR = totalImpressions > 0 ? totalClicks / totalImpressions : 0
    const avgPosition =
      (queries || []).reduce((sum, q) => sum + (q.position || 0), 0) / (queries?.length || 1)

    return NextResponse.json({
      success: true,
      dateRange: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      summary: {
        totalClicks,
        totalImpressions,
        avgCTR: Math.round(avgCTR * 10000) / 100, // percentage
        avgPosition: Math.round(avgPosition * 10) / 10,
      },
      topQueries: queries || [],
      topPages: pages || [],
    })
  } catch (error: any) {
    console.error('[Search Console] Get error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get Search Console data' },
      { status: 500 }
    )
  }
}
