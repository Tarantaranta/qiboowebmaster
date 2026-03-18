#!/usr/bin/env node

/**
 * Manual Script: Sync Initial SEO Data
 * Fetches Search Console data for the last 30 days for all websites
 */

require('dotenv').config({ path: '.env.local' })

const CRON_SECRET = process.env.CRON_SECRET
const BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `https://webmaster-app-${process.env.NEXT_PUBLIC_SUPABASE_URL.split('//')[1].split('.')[0]}.vercel.app`
  : 'http://localhost:3000'

async function syncInitialData() {
  console.log('╔════════════════════════════════════════╗')
  console.log('║  Initial SEO Data Sync                 ║')
  console.log('║  Webmaster Dashboard                   ║')
  console.log('╚════════════════════════════════════════╝\n')

  if (!CRON_SECRET) {
    console.error('❌ CRON_SECRET not found in .env.local')
    console.error('   This is required for secure API access.')
    process.exit(1)
  }

  console.log('🔄 Starting initial data sync...\n')

  // 1. Sync Search Console data (last 30 days)
  console.log('📊 Syncing Search Console data...')
  try {
    const response = await fetch(`${BASE_URL}/api/cron/search-console-sync`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Search Console sync completed')
      console.log(`   Synced: ${JSON.stringify(data, null, 2)}\n`)
    } else {
      console.error('❌ Search Console sync failed:', response.status)
      const error = await response.text()
      console.error('   Error:', error, '\n')
    }
  } catch (error) {
    console.error('❌ Search Console sync error:', error.message, '\n')
  }

  // 2. Run PageSpeed audits
  console.log('⚡ Running PageSpeed audits...')
  try {
    const response = await fetch(`${BASE_URL}/api/cron/pagespeed-check`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ PageSpeed audit completed')
      console.log(`   Results: ${JSON.stringify(data, null, 2)}\n`)
    } else {
      console.error('❌ PageSpeed audit failed:', response.status, '\n')
    }
  } catch (error) {
    console.error('❌ PageSpeed audit error:', error.message, '\n')
  }

  // 3. Run uptime checks
  console.log('🔍 Running uptime checks...')
  try {
    const response = await fetch(`${BASE_URL}/api/cron/uptime-check`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Uptime check completed')
      console.log(`   Results: ${JSON.stringify(data, null, 2)}\n`)
    } else {
      console.error('❌ Uptime check failed:', response.status, '\n')
    }
  } catch (error) {
    console.error('❌ Uptime check error:', error.message, '\n')
  }

  console.log('🎉 Initial data sync completed!')
  console.log('\n💡 Next steps:')
  console.log('   1. Check your dashboard at ' + BASE_URL)
  console.log('   2. Cron jobs will run automatically on Vercel')
  console.log('   3. Data will be updated daily\n')
}

// Run sync
syncInitialData().catch(console.error)
