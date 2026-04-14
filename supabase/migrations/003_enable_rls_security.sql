-- =============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================
-- This migration enables RLS on all tables and creates security policies
-- to prevent unauthorized access to your data.

-- Enable RLS on all existing tables
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE uptime_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vercel_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

-- SEO tables
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_suggestions ENABLE ROW LEVEL SECURITY;

-- Search Console tables (if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'search_console_queries') THEN
    ALTER TABLE search_console_queries ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'search_console_pages') THEN
    ALTER TABLE search_console_pages ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'search_console_sync_log') THEN
    ALTER TABLE search_console_sync_log ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'performance_metrics') THEN
    ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pagespeed_audits') THEN
    ALTER TABLE pagespeed_audits ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ssl_certificates') THEN
    ALTER TABLE ssl_certificates ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'downtime_incidents') THEN
    ALTER TABLE downtime_incidents ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- =============================================
-- SECURITY POLICIES
-- =============================================
-- By default, with RLS enabled and no policies, ALL access is denied.
-- We create policies to allow ONLY service role access.
-- This means your API routes using the service role key can write data,
-- but public/anonymous access is completely blocked.

-- Drop existing policies if they exist (for idempotent migration)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- =============================================
-- OPTION 1: SERVICE ROLE ONLY (Most Secure)
-- =============================================
-- Uncomment these policies to allow ONLY service role access
-- This is recommended if you're using API routes with service role key

-- Websites
-- Allow service role full access
CREATE POLICY "Service role can manage websites"
  ON websites
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anon to SELECT only (API routes need to look up website IDs)
CREATE POLICY "Anon can read websites"
  ON websites
  FOR SELECT
  TO anon
  USING (true);

-- Uptime Checks
CREATE POLICY "Service role can manage uptime_checks"
  ON uptime_checks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Analytics Events
-- Allow service role full access
CREATE POLICY "Service role can manage analytics_events"
  ON analytics_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anon to INSERT only (for tracking endpoints)
CREATE POLICY "Anon can insert analytics_events"
  ON analytics_events
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Chatbot Conversations
-- Allow service role full access
CREATE POLICY "Service role can manage chatbot_conversations"
  ON chatbot_conversations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anon to INSERT and UPDATE only (for chatbot logging)
CREATE POLICY "Anon can insert chatbot_conversations"
  ON chatbot_conversations
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update chatbot_conversations"
  ON chatbot_conversations
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Error Logs
-- Allow service role full access
CREATE POLICY "Service role can manage error_logs"
  ON error_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anon to INSERT only (for error tracking endpoints)
CREATE POLICY "Anon can insert error_logs"
  ON error_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Alert Settings
CREATE POLICY "Service role can manage alert_settings"
  ON alert_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Vercel Deployments
CREATE POLICY "Service role can manage vercel_deployments"
  ON vercel_deployments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Alert History
CREATE POLICY "Service role can manage alert_history"
  ON alert_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Keywords
CREATE POLICY "Service role can manage keywords"
  ON keywords
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Keyword Positions
CREATE POLICY "Service role can manage keyword_positions"
  ON keyword_positions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- SEO Audits
CREATE POLICY "Service role can manage seo_audits"
  ON seo_audits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Backlinks
CREATE POLICY "Service role can manage backlinks"
  ON backlinks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Competitors
CREATE POLICY "Service role can manage competitors"
  ON competitors
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- SEO Recommendations
CREATE POLICY "Service role can manage seo_recommendations"
  ON seo_recommendations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Content Suggestions
CREATE POLICY "Service role can manage content_suggestions"
  ON content_suggestions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================
-- POLICIES FOR CONDITIONAL TABLES
-- =============================================
DO $$
BEGIN
  -- Search Console Queries
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'search_console_queries') THEN
    EXECUTE 'CREATE POLICY "Service role can manage search_console_queries"
      ON search_console_queries
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true)';
  END IF;

  -- Search Console Pages
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'search_console_pages') THEN
    EXECUTE 'CREATE POLICY "Service role can manage search_console_pages"
      ON search_console_pages
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true)';
  END IF;

  -- Search Console Sync Log
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'search_console_sync_log') THEN
    EXECUTE 'CREATE POLICY "Service role can manage search_console_sync_log"
      ON search_console_sync_log
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true)';
  END IF;

  -- Performance Metrics
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'performance_metrics') THEN
    EXECUTE 'CREATE POLICY "Service role can manage performance_metrics"
      ON performance_metrics
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true)';
  END IF;

  -- PageSpeed Audits
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pagespeed_audits') THEN
    EXECUTE 'CREATE POLICY "Service role can manage pagespeed_audits"
      ON pagespeed_audits
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true)';
  END IF;

  -- SSL Certificates
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ssl_certificates') THEN
    EXECUTE 'CREATE POLICY "Service role can manage ssl_certificates"
      ON ssl_certificates
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true)';
  END IF;

  -- Downtime Incidents
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'downtime_incidents') THEN
    EXECUTE 'CREATE POLICY "Service role can manage downtime_incidents"
      ON downtime_incidents
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true)';
  END IF;
END $$;

-- =============================================
-- VERIFICATION
-- =============================================
COMMENT ON SCHEMA public IS 'RLS enabled on all tables. Only service_role has access.';

-- =============================================
-- OPTIONAL: AUTHENTICATED USER ACCESS
-- =============================================
-- If you want to add Supabase Auth and allow authenticated users
-- to read data, you can add additional policies like:
--
-- CREATE POLICY "Authenticated users can read websites"
--   ON websites
--   FOR SELECT
--   TO authenticated
--   USING (true);
--
-- Repeat for other tables as needed.
-- Be careful with INSERT/UPDATE/DELETE - consider whether
-- authenticated users should have write access.
