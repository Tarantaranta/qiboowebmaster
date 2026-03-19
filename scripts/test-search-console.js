#!/usr/bin/env node

/**
 * Test Google Search Console API Access
 * Checks which sites the service account can access
 */

require('dotenv').config({ path: '.env.local' })

const { google } = require('googleapis')

async function testSearchConsole() {
  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  GOOGLE SEARCH CONSOLE API TEST                       ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  try {
    // Check if credentials exist
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
    if (!credentialsJson) {
      console.log('❌ GOOGLE_APPLICATION_CREDENTIALS_JSON not found in environment')
      return
    }

    console.log('✅ Service account credentials found\n')

    // Parse credentials
    const credentials = JSON.parse(credentialsJson)
    console.log('📧 Service Account Email:', credentials.client_email)
    console.log('🔑 Project ID:', credentials.project_id, '\n')

    // Initialize auth
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    })

    const searchconsole = google.searchconsole({ version: 'v1', auth })

    // List all accessible sites
    console.log('🔍 Fetching accessible sites from Search Console...\n')

    const response = await searchconsole.sites.list()
    const sites = response.data.siteEntry || []

    if (sites.length === 0) {
      console.log('❌ NO SITES FOUND!')
      console.log('\n📝 This means:')
      console.log('   1. Service account has NOT been added to any Search Console properties')
      console.log('   2. You need to add this email to each website in Search Console:')
      console.log(`      ${credentials.client_email}`)
      console.log('\n📖 How to fix:')
      console.log('   1. Go to: https://search.google.com/search-console')
      console.log('   2. Select each website (drkeremal.com, anitya cavehouse.com, etc.)')
      console.log('   3. Go to Settings → Users and permissions')
      console.log('   4. Add User: ' + credentials.client_email)
      console.log('   5. Permission: Owner or Full')
      return
    }

    console.log(`✅ Found ${sites.length} accessible sites:\n`)

    sites.forEach((site, index) => {
      console.log(`${index + 1}. ${site.siteUrl}`)
      console.log(`   Permission: ${site.permissionLevel}`)
    })

    // Test data fetch for each site
    console.log('\n\n🔬 Testing data fetch for each site...\n')

    for (const site of sites) {
      const siteUrl = site.siteUrl
      console.log(`\n📊 Testing: ${siteUrl}`)

      try {
        // Calculate date range (last 7 days, minus 2 days for GSC delay)
        const endDate = new Date()
        endDate.setDate(endDate.getDate() - 2)
        const startDate = new Date(endDate)
        startDate.setDate(startDate.getDate() - 7)

        const startDateStr = startDate.toISOString().split('T')[0]
        const endDateStr = endDate.toISOString().split('T')[0]

        console.log(`   Date range: ${startDateStr} to ${endDateStr}`)

        const queryResponse = await searchconsole.searchanalytics.query({
          siteUrl,
          requestBody: {
            startDate: startDateStr,
            endDate: endDateStr,
            dimensions: ['query'],
            rowLimit: 10,
          },
        })

        const rows = queryResponse.data.rows || []

        if (rows.length === 0) {
          console.log('   ⚠️  No data available for this period')
          console.log('   → This might be normal if the site is new or has low traffic')
        } else {
          const totalClicks = rows.reduce((sum, row) => sum + (row.clicks || 0), 0)
          const totalImpressions = rows.reduce((sum, row) => sum + (row.impressions || 0), 0)

          console.log(`   ✅ Data found!`)
          console.log(`   → ${rows.length} queries (showing top 10)`)
          console.log(`   → ${totalClicks} total clicks`)
          console.log(`   → ${totalImpressions} total impressions`)

          if (rows.length > 0) {
            console.log('\n   Top 3 queries:')
            rows.slice(0, 3).forEach((row, i) => {
              console.log(`     ${i + 1}. "${row.keys[0]}" - ${row.clicks} clicks, ${row.impressions} impressions`)
            })
          }
        }
      } catch (error) {
        console.log(`   ❌ Error fetching data: ${error.message}`)
      }
    }

    console.log('\n\n═══════════════════════════════════════════════════════')
    console.log('SUMMARY')
    console.log('═══════════════════════════════════════════════════════')
    console.log(`✅ Service account working: YES`)
    console.log(`✅ Sites accessible: ${sites.length}`)
    console.log(`\n📝 Next steps:`)
    console.log(`   1. If sites are missing, add service account to Search Console`)
    console.log(`   2. Run cron job: /api/cron/search-console-sync`)
    console.log(`   3. Check database for imported data`)
    console.log('═══════════════════════════════════════════════════════\n')

  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    if (error.stack) {
      console.error('\nStack trace:', error.stack)
    }
  }
}

testSearchConsole().catch(console.error)
