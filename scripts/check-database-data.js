#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function checkData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  DATABASE DATA CHECK                                  ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // Check search_console_queries
  const { data: queries, count: queryCount } = await supabase
    .from('search_console_queries')
    .select('*', { count: 'exact', head: false })
    .limit(5)

  console.log(`📊 search_console_queries: ${queryCount} rows`)
  if (queries && queries.length > 0) {
    console.log('   Sample data:')
    queries.forEach(q => {
      console.log(`   - "${q.query}" (${q.clicks} clicks, ${q.impressions} impressions)`)
    })
  }
  console.log('')

  // Check search_console_pages
  const { data: pages, count: pageCount } = await supabase
    .from('search_console_pages')
    .select('*', { count: 'exact', head: true })

  console.log(`📄 search_console_pages: ${pageCount} rows\n`)

  // Check keywords table
  const { data: keywords, count: keywordCount } = await supabase
    .from('keywords')
    .select('*', { count: 'exact', head: true })

  console.log(`🎯 keywords (manual tracking): ${keywordCount} rows`)
  if (keywordCount === 0) {
    console.log('   ⚠️  No manually tracked keywords yet')
    console.log('   This is NORMAL - use search_console_queries for real data')
  }
  console.log('')

  // Check analytics_events
  const { data: events, count: eventCount } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })

  console.log(`📈 analytics_events: ${eventCount} rows`)
  if (eventCount === 0) {
    console.log('   ⚠️  No analytics events - tracking scripts not deployed')
  }
  console.log('')

  // Check uptime_checks
  const { data: uptime, count: uptimeCount } = await supabase
    .from('uptime_checks')
    .select('*', { count: 'exact', head: true })

  console.log(`⏰ uptime_checks: ${uptimeCount} rows`)
  if (uptimeCount === 0) {
    console.log('   ⚠️  No uptime checks - run uptime-check cron job')
  }
  console.log('')

  // Check per website
  const { data: websites } = await supabase
    .from('websites')
    .select('id, domain')

  console.log('═══════════════════════════════════════════════════════')
  console.log('PER WEBSITE BREAKDOWN')
  console.log('═══════════════════════════════════════════════════════\n')

  for (const website of websites || []) {
    const { count: queryCount } = await supabase
      .from('search_console_queries')
      .select('*', { count: 'exact', head: true })
      .eq('website_id', website.id)

    const { count: pageCount } = await supabase
      .from('search_console_pages')
      .select('*', { count: 'exact', head: true })
      .eq('website_id', website.id)

    const { data: querySample } = await supabase
      .from('search_console_queries')
      .select('clicks, impressions')
      .eq('website_id', website.id)
      .limit(1000)

    const totalClicks = querySample?.reduce((sum, q) => sum + (q.clicks || 0), 0) || 0
    const totalImpressions = querySample?.reduce((sum, q) => sum + (q.impressions || 0), 0) || 0

    console.log(`${website.domain}:`)
    console.log(`  Queries: ${queryCount}`)
    console.log(`  Pages: ${pageCount}`)
    console.log(`  Total Clicks: ${totalClicks}`)
    console.log(`  Total Impressions: ${totalImpressions}`)
    console.log('')
  }

  console.log('═══════════════════════════════════════════════════════\n')
}

checkData().catch(console.error)
