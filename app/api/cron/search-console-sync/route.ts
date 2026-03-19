import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Cron job to sync Google Search Console data for all websites daily
 *
 * Schedule: Daily at 8 AM UTC (recommended)
 * Vercel Cron: "0 8 * * *"
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET?.trim()

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  try {
    console.log('[CRON] Starting daily Search Console sync...', new Date().toISOString())

    // Fetch all websites
    const { data: websites } = await supabase
      .from('websites')
      .select('id, domain')

    if (!websites || websites.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No websites to sync',
      })
    }

    const results = []

    // Sync Search Console data for each website
    for (const website of websites) {
      try {
        const response = await fetch(
          `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/search-console/fetch`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              websiteId: website.id,
              days: 7, // Fetch last 7 days
              useDomainProperty: true, // Use sc-domain: format (covers all protocols and subdomains)
            }),
          }
        )

        const data = await response.json()
        results.push({
          website: website.domain,
          success: data.success || false,
          queries: data.results?.queries || 0,
          pages: data.results?.pages || 0,
          error: data.error || null,
        })

        if (data.success) {
          console.log(
            `✅ Search Console sync: ${website.domain} - ${data.results?.queries || 0} queries, ${data.results?.pages || 0} pages`
          )
        } else {
          console.error(`❌ Search Console sync failed for ${website.domain}:`, data.error)
        }

        // Wait 3 seconds between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 3000))
      } catch (error: any) {
        console.error(`❌ Search Console sync error for ${website.domain}:`, error.message)
        results.push({
          website: website.domain,
          success: false,
          queries: 0,
          pages: 0,
          error: error.message,
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failedCount = results.filter(r => !r.success).length

    console.log('[CRON] Search Console sync completed:', {
      total_websites: websites.length,
      successful: successCount,
      failed: failedCount,
    })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total: websites.length,
        successful: successCount,
        failed: failedCount,
      },
      results,
    })
  } catch (error: any) {
    console.error('[CRON] Search Console sync error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
