# Database Migration Guide - Webmaster Dashboard

## Overview

This project uses **Supabase** (hosted PostgreSQL) as its database. Migrations are plain SQL files that must be executed in order via the Supabase SQL Editor or CLI.

## Migration Files

Execute in the following order:

| # | File | Description | Tables Created |
|---|------|-------------|----------------|
| 1 | `supabase/migrations/001_initial_schema.sql` | Core schema | websites, uptime_checks, analytics_events, chatbot_conversations, error_logs, alert_settings, vercel_deployments, alert_history |
| 2 | `supabase/migrations/002_seo_tables.sql` | SEO module | keywords, keyword_positions, seo_audits, backlinks, competitors, seo_recommendations, content_suggestions |
| 3 | `database/migrations/add_downtime_tracking.sql` | Downtime tracking | (ALTER: websites.downtime_started_at) |
| 4 | `database/migrations/create_performance_metrics.sql` | Core Web Vitals | performance_metrics |
| 5 | `database/migrations/create_pagespeed_audits.sql` | PageSpeed data | pagespeed_audits |
| 6 | `database/migrations/create_ssl_certificates.sql` | SSL monitoring | ssl_certificates |
| 7 | `database/migrations/add_composite_indexes.sql` | Performance optimization | (indexes only) |

## How to Run Migrations

### Option A: Supabase Dashboard (Recommended for first setup)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste each migration file **in order** (1 through 6)
4. Click **Run** for each one
5. Verify with the queries below

### Option B: Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations (only works for files in supabase/migrations/)
supabase db push

# For files in database/migrations/, run them manually via SQL Editor
# or use psql:
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -f database/migrations/add_downtime_tracking.sql
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -f database/migrations/create_performance_metrics.sql
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -f database/migrations/create_pagespeed_audits.sql
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -f database/migrations/create_ssl_certificates.sql
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -f database/migrations/add_composite_indexes.sql
```

### Option C: Direct psql

```bash
# Get your connection string from Supabase Dashboard > Settings > Database
export DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Run all migrations in order
psql "$DATABASE_URL" -f supabase/migrations/001_initial_schema.sql
psql "$DATABASE_URL" -f supabase/migrations/002_seo_tables.sql
psql "$DATABASE_URL" -f database/migrations/add_downtime_tracking.sql
psql "$DATABASE_URL" -f database/migrations/create_performance_metrics.sql
psql "$DATABASE_URL" -f database/migrations/create_pagespeed_audits.sql
psql "$DATABASE_URL" -f database/migrations/create_ssl_certificates.sql
psql "$DATABASE_URL" -f database/migrations/add_composite_indexes.sql
```

## Idempotency

All migrations use `IF NOT EXISTS` / `IF EXISTS` and `ON CONFLICT DO NOTHING`, making them safe to run multiple times without errors or data duplication.

## Rollback Instructions

To completely remove all tables (DESTRUCTIVE - will delete all data):

```sql
-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS content_suggestions CASCADE;
DROP TABLE IF EXISTS seo_recommendations CASCADE;
DROP TABLE IF EXISTS competitors CASCADE;
DROP TABLE IF EXISTS backlinks CASCADE;
DROP TABLE IF EXISTS seo_audits CASCADE;
DROP TABLE IF EXISTS keyword_positions CASCADE;
DROP TABLE IF EXISTS keywords CASCADE;
DROP TABLE IF EXISTS ssl_certificates CASCADE;
DROP TABLE IF EXISTS pagespeed_audits CASCADE;
DROP TABLE IF EXISTS performance_metrics CASCADE;
DROP TABLE IF EXISTS alert_history CASCADE;
DROP TABLE IF EXISTS vercel_deployments CASCADE;
DROP TABLE IF EXISTS alert_settings CASCADE;
DROP TABLE IF EXISTS error_logs CASCADE;
DROP TABLE IF EXISTS chatbot_conversations CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS uptime_checks CASCADE;
DROP TABLE IF EXISTS websites CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_uptime_percentage(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_today_visitors(UUID);
DROP FUNCTION IF EXISTS get_keyword_rank_change(UUID);
DROP FUNCTION IF EXISTS get_top_keywords(UUID, INTEGER);

-- Remove added column (if rolling back only migration 3)
-- ALTER TABLE websites DROP COLUMN IF EXISTS downtime_started_at;
```

## Verification Queries

Run after all migrations to confirm everything is set up correctly:

```sql
-- 1. Verify all 19 tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
-- Expected: alert_history, alert_settings, analytics_events, backlinks,
--   chatbot_conversations, competitors, content_suggestions, error_logs,
--   keywords, keyword_positions, pagespeed_audits, performance_metrics,
--   seo_audits, seo_recommendations, ssl_certificates, uptime_checks,
--   vercel_deployments, websites

-- 2. Verify websites seed data
SELECT name, domain FROM websites ORDER BY name;
-- Expected: 4 rows (Anitya Cave House, Dr. Kerem Al, Gong Sahne, Qiboo AI)

-- 3. Verify alert_settings seed data (4 websites x 4 alert types = 16 rows)
SELECT COUNT(*) as alert_settings_count FROM alert_settings;
-- Expected: 16

-- 4. Verify all indexes exist
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5. Verify all functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
-- Expected: get_keyword_rank_change, get_today_visitors,
--   get_top_keywords, get_uptime_percentage

-- 6. Verify foreign key constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- 7. Verify downtime_started_at column was added to websites
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'websites' AND column_name = 'downtime_started_at';
-- Expected: 1 row

-- 8. Quick table row count summary
SELECT
  'websites' as tbl, COUNT(*) as cnt FROM websites
UNION ALL SELECT 'alert_settings', COUNT(*) FROM alert_settings
UNION ALL SELECT 'uptime_checks', COUNT(*) FROM uptime_checks
UNION ALL SELECT 'error_logs', COUNT(*) FROM error_logs;
```

## Database Architecture

### Entity Relationship Summary

```
websites (central table)
  |-- uptime_checks (1:N)
  |-- analytics_events (1:N)
  |-- chatbot_conversations (1:N)
  |-- error_logs (1:N)
  |-- alert_settings (1:N, unique per alert_type)
  |-- vercel_deployments (1:N)
  |-- alert_history (1:N)
  |-- keywords (1:N)
  |     |-- keyword_positions (1:N)
  |-- seo_audits (1:N)
  |-- backlinks (1:N)
  |-- competitors (1:N)
  |-- seo_recommendations (1:N)
  |-- content_suggestions (1:N)
  |-- performance_metrics (1:N)
  |-- pagespeed_audits (1:N)
  |-- ssl_certificates (1:N)
```

All child tables cascade-delete when a website is removed.

### Functions

| Function | Purpose |
|----------|---------|
| `get_uptime_percentage(website_id, hours)` | Returns uptime % for a website over N hours |
| `get_today_visitors(website_id)` | Returns unique visitor count for today |
| `get_keyword_rank_change(keyword_id)` | Returns position change for a keyword |
| `get_top_keywords(website_id, limit)` | Returns top-ranked keywords |
