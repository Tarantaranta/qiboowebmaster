// Quick script to check if data exists in database
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  console.log('🔍 Checking database...\n')

  // Check websites
  const { data: websites, error: websitesError } = await supabase
    .from('websites')
    .select('id, name, domain')

  console.log('📊 WEBSITES:')
  if (websitesError) {
    console.error('❌ Error:', websitesError.message)
  } else if (!websites || websites.length === 0) {
    console.log('⚠️  NO WEBSITES FOUND! You need to add websites first.')
  } else {
    console.log(`✅ Found ${websites.length} websites:`)
    websites.forEach(w => console.log(`   - ${w.name} (${w.domain})`))
  }

  console.log('\n')

  // Check analytics events
  const { count: analyticsCount, error: analyticsError } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })

  console.log('📈 ANALYTICS EVENTS:')
  if (analyticsError) {
    console.error('❌ Error:', analyticsError.message)
  } else {
    console.log(`${analyticsCount || 0} events total`)

    if (analyticsCount && analyticsCount > 0) {
      const { data: recentEvents } = await supabase
        .from('analytics_events')
        .select('event_type, page_url, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      console.log('Recent events:')
      recentEvents?.forEach(e => {
        console.log(`   - ${e.event_type} on ${e.page_url} (${new Date(e.created_at).toLocaleString()})`)
      })
    } else {
      console.log('⚠️  NO ANALYTICS DATA! Tracking script may not be working.')
    }
  }

  console.log('\n')

  // Check errors
  const { count: errorCount, error: errorError } = await supabase
    .from('error_logs')
    .select('*', { count: 'exact', head: true })

  console.log('🐛 ERROR LOGS:')
  if (errorError) {
    console.error('❌ Error:', errorError.message)
  } else {
    console.log(`${errorCount || 0} errors total`)
  }

  console.log('\n')

  // Check uptime checks
  const { count: uptimeCount, error: uptimeError } = await supabase
    .from('uptime_checks')
    .select('*', { count: 'exact', head: true })

  console.log('⏰ UPTIME CHECKS:')
  if (uptimeError) {
    console.error('❌ Error:', uptimeError.message)
  } else {
    console.log(`${uptimeCount || 0} checks total`)
  }

  console.log('\n✅ Data check complete!')
}

checkData().catch(console.error)
