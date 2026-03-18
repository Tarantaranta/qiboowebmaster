import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Cron job to run daily PageSpeed audits for all websites
 *
 * Schedule: Daily (recommended: early morning when traffic is low)
 * Vercel Cron: "0 6 * * *" (6 AM UTC daily)
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
    console.log('[CRON] Starting daily PageSpeed audits...', new Date().toISOString())

    // Fetch all websites
    const { data: websites } = await supabase
      .from('websites')
      .select('id, domain')

    if (!websites || websites.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No websites to audit'
      })
    }

    const results = []

    // Run PageSpeed audit for each website (both mobile and desktop)
    for (const website of websites) {
      const url = `https://${website.domain}`

      // Mobile audit
      try {
        const mobileResponse = await fetch(
          `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/pagespeed/analyze`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url,
              websiteId: website.id,
              strategy: 'mobile'
            })
          }
        )

        const mobileData = await mobileResponse.json()
        results.push({
          website: website.domain,
          strategy: 'mobile',
          success: mobileData.success,
          score: mobileData.data?.scores?.performance || null
        })

        console.log(`✅ Mobile audit: ${website.domain} - ${mobileData.data?.scores?.performance || 'N/A'}`)

        // Wait 2 seconds between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error: any) {
        console.error(`❌ Mobile audit failed for ${website.domain}:`, error.message)
        results.push({
          website: website.domain,
          strategy: 'mobile',
          success: false,
          error: error.message
        })
      }

      // Desktop audit
      try {
        const desktopResponse = await fetch(
          `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/pagespeed/analyze`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url,
              websiteId: website.id,
              strategy: 'desktop'
            })
          }
        )

        const desktopData = await desktopResponse.json()
        results.push({
          website: website.domain,
          strategy: 'desktop',
          success: desktopData.success,
          score: desktopData.data?.scores?.performance || null
        })

        console.log(`✅ Desktop audit: ${website.domain} - ${desktopData.data?.scores?.performance || 'N/A'}`)

        // Wait 2 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error: any) {
        console.error(`❌ Desktop audit failed for ${website.domain}:`, error.message)
        results.push({
          website: website.domain,
          strategy: 'desktop',
          success: false,
          error: error.message
        })
      }
    }

    console.log('[CRON] PageSpeed audits completed:', {
      total_websites: websites.length,
      total_audits: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    })

  } catch (error: any) {
    console.error('[CRON] PageSpeed audit error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
