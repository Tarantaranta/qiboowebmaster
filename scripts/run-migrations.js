#!/usr/bin/env node

/**
 * Automatic Database Migration Runner
 * Runs all SQL migrations on Supabase in order
 */

const fs = require('fs')
const path = require('path')
const { Client } = require('pg')
require('dotenv').config({ path: '.env.local' })

// Migration files in order
const MIGRATIONS = [
  'supabase/migrations/001_initial_schema.sql',
  'supabase/migrations/002_seo_tables.sql',
  'database/migrations/add_downtime_tracking.sql',
  'database/migrations/create_performance_metrics.sql',
  'database/migrations/create_pagespeed_audits.sql',
  'database/migrations/create_ssl_certificates.sql',
  'database/migrations/create_search_console_tables.sql',
  'database/migrations/add_composite_indexes.sql',
]

async function runMigrations() {
  // Parse Supabase URL to get connection details
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  // Extract database connection info from Supabase URL
  // Format: https://xxxxx.supabase.co -> xxxxx.db.supabase.co:5432
  const projectRef = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)?.[1]

  if (!projectRef) {
    console.error('❌ Invalid Supabase URL format')
    process.exit(1)
  }

  // Construct PostgreSQL connection string
  // You'll need to get the database password from Supabase dashboard
  const connectionString = process.env.DATABASE_URL ||
    `postgresql://postgres:[YOUR_DB_PASSWORD]@db.${projectRef}.supabase.co:5432/postgres`

  console.log('🔄 Connecting to Supabase database...')
  console.log(`   Project: ${projectRef}`)

  // Check if we have a valid connection string
  if (connectionString.includes('[YOUR_DB_PASSWORD]')) {
    console.error('\n❌ Database password not set!')
    console.error('\nPlease add DATABASE_URL to your .env.local:')
    console.error(`\nDATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.${projectRef}.supabase.co:5432/postgres`)
    console.error('\nGet your password from:')
    console.error('https://app.supabase.com/project/' + projectRef + '/settings/database')
    process.exit(1)
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('✅ Connected to database\n')

    // Run each migration
    for (let i = 0; i < MIGRATIONS.length; i++) {
      const migrationPath = path.join(process.cwd(), MIGRATIONS[i])
      const migrationName = path.basename(MIGRATIONS[i])

      console.log(`📄 [${i + 1}/${MIGRATIONS.length}] Running: ${migrationName}`)

      if (!fs.existsSync(migrationPath)) {
        console.log(`   ⚠️  File not found, skipping...`)
        continue
      }

      const sql = fs.readFileSync(migrationPath, 'utf8')

      try {
        await client.query(sql)
        console.log(`   ✅ Success\n`)
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`)

        // Continue on certain errors (like table already exists)
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`   ℹ️  Continuing (idempotent migration)\n`)
        } else {
          throw error
        }
      }
    }

    console.log('🎉 All migrations completed successfully!')
    console.log('\n📊 Verifying tables...')

    // Verify tables
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)

    console.log(`\n✅ Found ${result.rows.length} tables:`)
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`)
    })

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

// Run migrations
console.log('╔════════════════════════════════════════╗')
console.log('║  Database Migration Runner             ║')
console.log('║  Webmaster Dashboard                   ║')
console.log('╚════════════════════════════════════════╝\n')

runMigrations().catch(console.error)
