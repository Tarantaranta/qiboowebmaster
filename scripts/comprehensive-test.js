#!/usr/bin/env node

/**
 * COMPREHENSIVE SITE AUDIT
 * Tests EVERYTHING: Pages, APIs, Buttons, Data, Connections
 */

require('dotenv').config({ path: '.env.local' })

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://qiboowebmasterapp.vercel.app'
const CRON_SECRET = process.env.CRON_SECRET

const results = {
  passed: [],
  failed: [],
  warnings: []
}

function log(status, category, test, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'
  const message = `${icon} [${category}] ${test}${details ? ': ' + details : ''}`
  console.log(message)

  if (status === 'PASS') results.passed.push({ category, test, details })
  else if (status === 'FAIL') results.failed.push({ category, test, details })
  else results.warnings.push({ category, test, details })
}

async function testEndpoint(name, url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(10000)
    })

    const status = response.status
    const ok = response.ok

    if (ok) {
      log('PASS', 'API', name, `${status}`)
      return { ok: true, status, data: await response.text() }
    } else {
      log('FAIL', 'API', name, `${status} - ${response.statusText}`)
      return { ok: false, status, error: response.statusText }
    }
  } catch (error) {
    log('FAIL', 'API', name, error.message)
    return { ok: false, error: error.message }
  }
}

async function runComprehensiveAudit() {
  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║     COMPREHENSIVE WEBMASTER DASHBOARD AUDIT           ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  console.log(`🔍 Testing: ${BASE_URL}\n`)

  // Use a valid UUID format for testing (this is a dummy UUID, database may reject it, but syntax will be correct)
  const testWebsiteId = '00000000-0000-0000-0000-000000000000'

  // ==========================================
  // 1. DASHBOARD PAGES
  // ==========================================
  console.log('\n📄 === TESTING DASHBOARD PAGES ===\n')

  const pages = [
    '/dashboard',
    '/dashboard/monitoring',
    '/dashboard/analytics',
    '/dashboard/performance',
    '/dashboard/uptime',
    '/dashboard/ssl',
    '/dashboard/funnels',
    '/dashboard/realtime',
    '/dashboard/seo',
    '/dashboard/keywords',
    '/dashboard/reports',
    '/dashboard/actions',
    '/dashboard/errors',
    '/dashboard/chatbot',
    '/dashboard/settings'
  ]

  for (const page of pages) {
    await testEndpoint(`Page: ${page}`, `${BASE_URL}${page}`)
  }

  // ==========================================
  // 2. CRON JOB ENDPOINTS (with auth)
  // ==========================================
  console.log('\n🕐 === TESTING CRON JOB ENDPOINTS ===\n')

  if (!CRON_SECRET) {
    log('FAIL', 'CONFIG', 'CRON_SECRET', 'Not configured in .env.local')
  }

  const cronEndpoints = [
    '/api/cron/search-console-sync',
    '/api/cron/pagespeed-check',
    '/api/cron/uptime-check',
    '/api/cron/smart-health-check',
    '/api/cron/weekly-reports'
  ]

  for (const endpoint of cronEndpoints) {
    await testEndpoint(
      `Cron: ${endpoint}`,
      `${BASE_URL}${endpoint}`,
      {
        headers: {
          'Authorization': `Bearer ${CRON_SECRET}`
        }
      }
    )
  }

  // ==========================================
  // 3. TEST API ENDPOINTS
  // ==========================================
  console.log('\n🧪 === TESTING TEST ENDPOINTS ===\n')

  const testEndpoints = [
    { path: '/api/test/chatbot', method: 'POST', body: { domain: 'drkeremal.com', websiteId: testWebsiteId } },
    { path: '/api/test/calendar', method: 'POST', body: { domain: 'drkeremal.com', websiteId: testWebsiteId } },
    { path: '/api/test/ssl', method: 'POST', body: { domain: 'drkeremal.com', websiteId: testWebsiteId } }
  ]

  for (const endpoint of testEndpoints) {
    await testEndpoint(
      `Test: ${endpoint.path}`,
      `${BASE_URL}${endpoint.path}`,
      {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(endpoint.body)
      }
    )
  }

  // ==========================================
  // 4. ANALYTICS API ENDPOINTS
  // ==========================================
  console.log('\n📊 === TESTING ANALYTICS ENDPOINTS ===\n')

  const analyticsEndpoints = [
    {
      path: '/api/analytics/track',
      body: {
        websiteId: testWebsiteId,
        pageUrl: 'https://test.com',
        eventType: 'pageview',
        sessionId: 'test-session'
      }
    },
    {
      path: '/api/errors/log',
      body: {
        websiteId: testWebsiteId,
        errorMessage: 'Test error',
        pageUrl: 'https://test.com',
        errorType: 'JavaScript'
      }
    },
    {
      path: '/api/performance/metrics',
      body: {
        websiteId: testWebsiteId,
        pageUrl: 'https://test.com',
        metricName: 'LCP',
        metricValue: 2500
      }
    }
  ]

  for (const endpoint of analyticsEndpoints) {
    await testEndpoint(`Analytics: ${endpoint.path}`, `${BASE_URL}${endpoint.path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(endpoint.body)
    })
  }

  // ==========================================
  // 5. REPORTS API
  // ==========================================
  console.log('\n📑 === TESTING REPORTS ENDPOINTS ===\n')

  await testEndpoint('Reports: Generate', `${BASE_URL}/api/reports/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ websiteId: testWebsiteId, metrics: ['traffic'], format: 'csv' })
  })

  // ==========================================
  // 6. ENVIRONMENT VARIABLES
  // ==========================================
  console.log('\n🔐 === CHECKING ENVIRONMENT VARIABLES ===\n')

  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'CRON_SECRET',
    'GOOGLE_APPLICATION_CREDENTIALS_JSON',
    'GOOGLE_PAGESPEED_API_KEY',
    'OPENAI_API_KEY',
    'GMAIL_USER',
    'GMAIL_APP_PASSWORD',
    'DATABASE_URL'
  ]

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      log('PASS', 'ENV', envVar, 'Configured')
    } else {
      log('FAIL', 'ENV', envVar, 'Missing!')
    }
  }

  // ==========================================
  // 7. GOOGLE API TESTS
  // ==========================================
  console.log('\n🔍 === TESTING GOOGLE APIS ===\n')

  // Test PageSpeed API
  try {
    const pagespeedUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://drkeremal.com&key=${process.env.GOOGLE_PAGESPEED_API_KEY}`
    const response = await fetch(pagespeedUrl, { signal: AbortSignal.timeout(15000) })
    if (response.ok) {
      log('PASS', 'GOOGLE', 'PageSpeed API', 'Working')
    } else {
      log('FAIL', 'GOOGLE', 'PageSpeed API', `${response.status} - ${response.statusText}`)
    }
  } catch (error) {
    log('FAIL', 'GOOGLE', 'PageSpeed API', error.message)
  }

  // Test Search Console API (requires proper setup)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    log('PASS', 'GOOGLE', 'Search Console Credentials', 'Configured')
  } else {
    log('FAIL', 'GOOGLE', 'Search Console Credentials', 'Missing')
  }

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n' + '='.repeat(60))
  console.log('AUDIT SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ PASSED: ${results.passed.length}`)
  console.log(`❌ FAILED: ${results.failed.length}`)
  console.log(`⚠️  WARNINGS: ${results.warnings.length}`)
  console.log('='.repeat(60))

  if (results.failed.length > 0) {
    console.log('\n❌ CRITICAL FAILURES:\n')
    results.failed.forEach(({ category, test, details }) => {
      console.log(`  [${category}] ${test}: ${details}`)
    })
  }

  console.log('\n💡 Next Steps:')
  console.log('  1. Fix critical failures above')
  console.log('  2. Check Vercel deployment logs')
  console.log('  3. Verify all environment variables in Vercel dashboard')
  console.log('  4. Test manually at: ' + BASE_URL)
  console.log('')
}

runComprehensiveAudit().catch(console.error)
