import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkKeywordRank, checkMultipleKeywordRanks } from '@/lib/seo/rank-tracker'

export const dynamic = 'force-dynamic'

/**
 * Check keyword rankings
 * POST /api/keywords/check-ranks
 *
 * Body:
 * {
 *   "websiteId": "uuid",
 *   "keywordIds": ["uuid1", "uuid2"], // Optional: specific keywords, or all if not provided
 *   "location": "Turkey" // Optional
 * }
 */
export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const body = await request.json()
    const { websiteId, keywordIds, location = 'Turkey' } = body

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

    // Get keywords to check
    let query = supabase
      .from('keywords')
      .select('*')
      .eq('website_id', websiteId)
      .eq('is_tracking', true)

    if (keywordIds && keywordIds.length > 0) {
      query = query.in('id', keywordIds)
    }

    const { data: keywords, error: keywordsError } = await query

    if (keywordsError || !keywords || keywords.length === 0) {
      return NextResponse.json(
        { error: 'No keywords found to check' },
        { status: 404 }
      )
    }

    console.log(`[Rank Check] Checking ${keywords.length} keywords for ${website.domain}`)

    const results = []

    // Check each keyword
    for (const keyword of keywords) {
      try {
        const rankResult = await checkKeywordRank(
          keyword.keyword,
          website.domain,
          location
        )

        // Store position history
        const { error: insertError } = await supabase
          .from('keyword_positions')
          .insert({
            keyword_id: keyword.id,
            rank_position: rankResult.position,
            url: rankResult.url,
            location: rankResult.location,
            search_engine: rankResult.searchEngine,
          })

        if (insertError) {
          console.error(`Failed to store position for "${keyword.keyword}":`, insertError)
        }

        // Update current position in keywords table
        const { error: updateError } = await supabase
          .from('keywords')
          .update({
            current_position: rankResult.position,
            last_checked_at: new Date().toISOString(),
          })
          .eq('id', keyword.id)

        if (updateError) {
          console.error(`Failed to update keyword "${keyword.keyword}":`, updateError)
        }

        results.push({
          keyword: keyword.keyword,
          position: rankResult.position,
          found: rankResult.found,
          url: rankResult.url,
          previousPosition: keyword.current_position,
        })

        console.log(
          `✅ ${keyword.keyword}: ${rankResult.position ? `#${rankResult.position}` : 'Not found'}`
        )

        // Wait 1 second between checks to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error: any) {
        console.error(`❌ Failed to check "${keyword.keyword}":`, error.message)
        results.push({
          keyword: keyword.keyword,
          position: null,
          found: false,
          url: null,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      website: website.domain,
      location,
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (error: any) {
    console.error('[Rank Check] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check keyword ranks' },
      { status: 500 }
    )
  }
}

/**
 * Get keyword ranking history
 * GET /api/keywords/check-ranks?keywordId=uuid&days=30
 */
export async function GET(request: Request) {
  const supabase = await createClient()

  try {
    const { searchParams } = new URL(request.url)
    const keywordId = searchParams.get('keywordId')
    const days = parseInt(searchParams.get('days') || '30', 10)

    if (!keywordId) {
      return NextResponse.json(
        { error: 'keywordId is required' },
        { status: 400 }
      )
    }

    // Get keyword
    const { data: keyword, error: keywordError } = await supabase
      .from('keywords')
      .select('*')
      .eq('id', keywordId)
      .single()

    if (keywordError || !keyword) {
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      )
    }

    // Get position history
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: positions, error: positionsError } = await supabase
      .from('keyword_positions')
      .select('*')
      .eq('keyword_id', keywordId)
      .gte('checked_at', startDate.toISOString())
      .order('checked_at', { ascending: false })

    if (positionsError) {
      throw positionsError
    }

    // Calculate stats
    const positionsArray = (positions || []).map(p => p.rank_position).filter(p => p !== null)
    const bestPosition = positionsArray.length > 0 ? Math.min(...positionsArray) : null
    const worstPosition = positionsArray.length > 0 ? Math.max(...positionsArray) : null
    const avgPosition =
      positionsArray.length > 0
        ? Math.round((positionsArray.reduce((sum, p) => sum + p, 0) / positionsArray.length) * 10) / 10
        : null

    return NextResponse.json({
      success: true,
      keyword: {
        id: keyword.id,
        keyword: keyword.keyword,
        currentPosition: keyword.current_position,
        searchVolume: keyword.search_volume,
        difficulty: keyword.difficulty,
      },
      stats: {
        bestPosition,
        worstPosition,
        avgPosition,
        totalChecks: positions?.length || 0,
      },
      history: positions || [],
    })
  } catch (error: any) {
    console.error('[Rank Check] Get error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get ranking history' },
      { status: 500 }
    )
  }
}
