-- =============================================
-- WEBMASTER DASHBOARD - COMPLETE DATABASE MIGRATION
-- =============================================
-- Run this entire file in Supabase SQL Editor
-- This migration is idempotent - safe to run multiple times.
-- =============================================

-- =============================================
-- MIGRATION 1: INITIAL SCHEMA
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. WEBSITES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS websites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  vercel_project_id TEXT,
  ga_property_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_checked_at TIMESTAMPTZ,
  status TEXT DEFAULT 'unknown' CHECK (status IN ('online', 'offline', 'degraded', 'unknown')),
  favicon_url TEXT,
  description TEXT
);

-- =============================================
-- 2. UPTIME CHECKS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS uptime_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  status_code INTEGER,
  response_time INTEGER, -- milliseconds
  is_up BOOLEAN NOT NULL,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT,
  ssl_valid BOOLEAN,
  ssl_expires_at TIMESTAMPTZ
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_uptime_checks_website_id ON uptime_checks(website_id);
CREATE INDEX IF NOT EXISTS idx_uptime_checks_checked_at ON uptime_checks(checked_at DESC);

-- =============================================
-- 3. ANALYTICS EVENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('pageview', 'click', 'custom')),
  page_url TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT NOT NULL,
  user_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_website_id ON analytics_events(website_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);

-- =============================================
-- 4. CHATBOT CONVERSATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  user_info JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  message_count INTEGER DEFAULT 0,
  is_resolved BOOLEAN DEFAULT FALSE,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  tags TEXT[] DEFAULT '{}'::text[]
);

-- Indexes for chatbot queries
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_website_id ON chatbot_conversations(website_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_session_id ON chatbot_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_started_at ON chatbot_conversations(started_at DESC);

-- =============================================
-- 5. ERROR LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  page_url TEXT NOT NULL,
  user_agent TEXT,
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_resolved BOOLEAN DEFAULT FALSE,
  notified_via_sms BOOLEAN DEFAULT FALSE,
  notified_via_email BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  occurrences INTEGER DEFAULT 1
);

-- Indexes for error logs
CREATE INDEX IF NOT EXISTS idx_error_logs_website_id ON error_logs(website_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_is_resolved ON error_logs(is_resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);

-- =============================================
-- 6. ALERT SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS alert_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('uptime', 'error', 'traffic_spike', 'ssl_expiry')),
  enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  email_enabled BOOLEAN DEFAULT TRUE,
  telegram_enabled BOOLEAN DEFAULT TRUE,
  threshold JSONB DEFAULT '{}'::jsonb,
  cooldown_minutes INTEGER DEFAULT 15,
  last_triggered_at TIMESTAMPTZ,
  UNIQUE(website_id, alert_type)
);

-- =============================================
-- 7. VERCEL DEPLOYMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS vercel_deployments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  deployment_id TEXT NOT NULL UNIQUE,
  deployment_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('BUILDING', 'READY', 'ERROR', 'CANCELED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ready_at TIMESTAMPTZ,
  commit_message TEXT,
  commit_sha TEXT,
  branch TEXT,
  build_duration_ms INTEGER
);

-- Index for deployments
CREATE INDEX IF NOT EXISTS idx_vercel_deployments_website_id ON vercel_deployments(website_id);
CREATE INDEX IF NOT EXISTS idx_vercel_deployments_created_at ON vercel_deployments(created_at DESC);

-- =============================================
-- 8. ALERT HISTORY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS alert_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_via TEXT[] NOT NULL, -- ['telegram', 'email', 'sms']
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for alert history
CREATE INDEX IF NOT EXISTS idx_alert_history_website_id ON alert_history(website_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_created_at ON alert_history(created_at DESC);

-- =============================================
-- INITIAL DATA - INSERT 4 WEBSITES (idempotent)
-- =============================================
INSERT INTO websites (name, domain, description) VALUES
  ('Dr. Kerem Al', 'drkeremal.com', 'Kişisel website'),
  ('Gong Sahne', 'gongsahne.com', 'Sanat ve kültür platformu'),
  ('Anitya Cave House', 'anityacavehouse.com', 'Otel ve rezervasyon'),
  ('Qiboo AI', 'qiboo.ai', 'AI chatbot platformu')
ON CONFLICT (domain) DO NOTHING;

-- =============================================
-- DEFAULT ALERT SETTINGS FOR ALL WEBSITES (idempotent)
-- =============================================
INSERT INTO alert_settings (website_id, alert_type, enabled, telegram_enabled, email_enabled, threshold)
SELECT
  id,
  alert_type,
  TRUE,
  TRUE,
  TRUE,
  CASE alert_type
    WHEN 'uptime' THEN '{"max_downtime_minutes": 5}'::jsonb
    WHEN 'error' THEN '{"min_errors_per_hour": 10}'::jsonb
    WHEN 'traffic_spike' THEN '{"percentage_increase": 200}'::jsonb
    WHEN 'ssl_expiry' THEN '{"days_before_expiry": 7}'::jsonb
  END
FROM websites
CROSS JOIN (
  VALUES ('uptime'), ('error'), ('traffic_spike'), ('ssl_expiry')
) AS alert_types(alert_type)
ON CONFLICT (website_id, alert_type) DO NOTHING;

-- =============================================
-- USEFUL FUNCTIONS
-- =============================================

-- Function to get uptime percentage for a website
CREATE OR REPLACE FUNCTION get_uptime_percentage(
  p_website_id UUID,
  p_hours INTEGER DEFAULT 24
)
RETURNS NUMERIC AS $$
DECLARE
  v_total_checks INTEGER;
  v_successful_checks INTEGER;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE is_up = TRUE)
  INTO v_total_checks, v_successful_checks
  FROM uptime_checks
  WHERE website_id = p_website_id
    AND checked_at >= NOW() - (p_hours || ' hours')::INTERVAL;

  IF v_total_checks = 0 THEN
    RETURN NULL;
  END IF;

  RETURN ROUND((v_successful_checks::NUMERIC / v_total_checks::NUMERIC) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to get today's visitor count
CREATE OR REPLACE FUNCTION get_today_visitors(p_website_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT session_id)
    FROM analytics_events
    WHERE website_id = p_website_id
      AND event_type = 'pageview'
      AND created_at >= CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE websites IS 'Monitored websites';
COMMENT ON TABLE uptime_checks IS 'Historical uptime check results';
COMMENT ON TABLE analytics_events IS 'Custom analytics tracking events';
COMMENT ON TABLE chatbot_conversations IS 'Chatbot conversation logs';
COMMENT ON TABLE error_logs IS 'JavaScript and server error logs';
COMMENT ON TABLE alert_settings IS 'Alert configuration per website';
COMMENT ON TABLE vercel_deployments IS 'Vercel deployment history';
COMMENT ON TABLE alert_history IS 'History of sent alerts';

-- =============================================
-- MIGRATION 2: SEO TABLES
-- =============================================

-- =============================================
-- 1. KEYWORDS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  search_volume INTEGER,
  difficulty INTEGER, -- 0-100
  current_position INTEGER,
  previous_position INTEGER,
  best_position INTEGER,
  url TEXT, -- Hangi sayfada rank ediyor
  added_at TIMESTAMPTZ DEFAULT NOW(),
  last_checked_at TIMESTAMPTZ,
  is_tracking BOOLEAN DEFAULT TRUE,
  notes TEXT,
  UNIQUE(website_id, keyword)
);

CREATE INDEX IF NOT EXISTS idx_keywords_website_id ON keywords(website_id);
CREATE INDEX IF NOT EXISTS idx_keywords_tracking ON keywords(is_tracking) WHERE is_tracking = TRUE;

-- =============================================
-- 2. KEYWORD POSITIONS HISTORY
-- =============================================
CREATE TABLE IF NOT EXISTS keyword_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  rank_position INTEGER NOT NULL,
  url TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  search_engine TEXT DEFAULT 'google'
);

CREATE INDEX IF NOT EXISTS idx_keyword_positions_keyword_id ON keyword_positions(keyword_id);
CREATE INDEX IF NOT EXISTS idx_keyword_positions_checked_at ON keyword_positions(checked_at DESC);

-- =============================================
-- 3. SEO AUDITS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS seo_audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  score INTEGER, -- 0-100
  issues JSONB DEFAULT '[]'::jsonb, -- [{type, severity, message, fix}]
  recommendations JSONB DEFAULT '[]'::jsonb,
  ai_analysis TEXT,
  meta_title TEXT,
  meta_description TEXT,
  h1_tags TEXT[],
  h2_tags TEXT[],
  word_count INTEGER,
  internal_links_count INTEGER,
  external_links_count INTEGER,
  images_count INTEGER,
  images_without_alt INTEGER,
  page_load_time INTEGER, -- milliseconds
  mobile_friendly BOOLEAN,
  https_enabled BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seo_audits_website_id ON seo_audits(website_id);
CREATE INDEX IF NOT EXISTS idx_seo_audits_created_at ON seo_audits(created_at DESC);

-- =============================================
-- 4. BACKLINKS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS backlinks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  target_url TEXT NOT NULL,
  anchor_text TEXT,
  rel_attribute TEXT, -- follow, nofollow, sponsored, ugc
  domain_authority INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(website_id, source_url, target_url)
);

CREATE INDEX IF NOT EXISTS idx_backlinks_website_id ON backlinks(website_id);
CREATE INDEX IF NOT EXISTS idx_backlinks_is_active ON backlinks(is_active) WHERE is_active = TRUE;

-- =============================================
-- 5. COMPETITORS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  competitor_domain TEXT NOT NULL,
  competitor_name TEXT,
  estimated_traffic INTEGER,
  domain_authority INTEGER,
  notes TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  last_analyzed TIMESTAMPTZ,
  UNIQUE(website_id, competitor_domain)
);

CREATE INDEX IF NOT EXISTS idx_competitors_website_id ON competitors(website_id);

-- =============================================
-- 6. SEO RECOMMENDATIONS TABLE (AI-POWERED)
-- =============================================
CREATE TABLE IF NOT EXISTS seo_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  url TEXT,
  category TEXT, -- content, technical, keywords, links, performance
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_score INTEGER, -- 0-100 expected impact
  effort_score INTEGER, -- 0-100 required effort
  is_implemented BOOLEAN DEFAULT FALSE,
  implemented_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ai_generated BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_seo_recommendations_website_id ON seo_recommendations(website_id);
CREATE INDEX IF NOT EXISTS idx_seo_recommendations_priority ON seo_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_seo_recommendations_implemented ON seo_recommendations(is_implemented);

-- =============================================
-- 7. CONTENT SUGGESTIONS TABLE (AI)
-- =============================================
CREATE TABLE IF NOT EXISTS content_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  keywords TEXT[],
  suggested_title TEXT,
  outline TEXT,
  target_word_count INTEGER,
  estimated_difficulty TEXT, -- easy, medium, hard
  potential_traffic INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_created BOOLEAN DEFAULT FALSE,
  created_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_content_suggestions_website_id ON content_suggestions(website_id);
CREATE INDEX IF NOT EXISTS idx_content_suggestions_created ON content_suggestions(is_created);

-- =============================================
-- USEFUL FUNCTIONS FOR SEO
-- =============================================

-- Get keyword ranking change
CREATE OR REPLACE FUNCTION get_keyword_rank_change(p_keyword_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_current INTEGER;
  v_previous INTEGER;
BEGIN
  SELECT current_position, previous_position
  INTO v_current, v_previous
  FROM keywords
  WHERE id = p_keyword_id;

  IF v_current IS NULL OR v_previous IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN v_previous - v_current; -- Positive = improvement, Negative = decline
END;
$$ LANGUAGE plpgsql;

-- Get top performing keywords
CREATE OR REPLACE FUNCTION get_top_keywords(p_website_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  keyword TEXT,
  rank_position INTEGER,
  rank_change INTEGER,
  url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.keyword,
    k.current_position,
    COALESCE(k.previous_position - k.current_position, 0) as rank_change,
    k.url
  FROM keywords k
  WHERE k.website_id = p_website_id
    AND k.is_tracking = TRUE
    AND k.current_position IS NOT NULL
  ORDER BY k.current_position ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE keywords IS 'Tracked keywords for each website';
COMMENT ON TABLE keyword_positions IS 'Historical keyword position tracking';
COMMENT ON TABLE seo_audits IS 'SEO audit results and recommendations';
COMMENT ON TABLE backlinks IS 'Backlink monitoring';
COMMENT ON TABLE competitors IS 'Competitor tracking';
COMMENT ON TABLE seo_recommendations IS 'AI-powered SEO recommendations';
COMMENT ON TABLE content_suggestions IS 'AI-generated content ideas';

-- =============================================
-- MIGRATION 3: DOWNTIME TRACKING
-- =============================================

-- Add downtime_started_at column to websites table
ALTER TABLE websites
ADD COLUMN IF NOT EXISTS downtime_started_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_websites_downtime_started_at ON websites(downtime_started_at);

COMMENT ON COLUMN websites.downtime_started_at IS 'Timestamp when the website went offline (null when online)';

-- =============================================
-- MIGRATION 4: PERFORMANCE METRICS
-- =============================================

-- Create performance_metrics table for Core Web Vitals tracking
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  metric_name VARCHAR(50) NOT NULL, -- LCP, INP, CLS, TTFB, FCP
  metric_value NUMERIC NOT NULL,
  rating VARCHAR(20), -- good, needs-improvement, poor
  delta NUMERIC,
  metric_id TEXT, -- Unique ID from web-vitals library
  navigation_type VARCHAR(50), -- navigate, reload, back-forward, prerender
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_performance_metrics_website_id ON performance_metrics(website_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_page_url ON performance_metrics(page_url);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_rating ON performance_metrics(rating);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_performance_metrics_website_metric_date
ON performance_metrics(website_id, metric_name, created_at DESC);

COMMENT ON TABLE performance_metrics IS 'Stores Core Web Vitals and performance metrics (LCP, INP, CLS, TTFB, FCP)';
COMMENT ON COLUMN performance_metrics.metric_name IS 'LCP (Largest Contentful Paint), INP (Interaction to Next Paint), CLS (Cumulative Layout Shift), TTFB (Time to First Byte), FCP (First Contentful Paint)';
COMMENT ON COLUMN performance_metrics.rating IS 'Google rating: good, needs-improvement, poor';
COMMENT ON COLUMN performance_metrics.delta IS 'Change since last measurement';
COMMENT ON COLUMN performance_metrics.navigation_type IS 'How the page was loaded: navigate, reload, back-forward, prerender';

-- =============================================
-- MIGRATION 5: PAGESPEED AUDITS
-- =============================================

-- Create pagespeed_audits table for PageSpeed Insights results
CREATE TABLE IF NOT EXISTS pagespeed_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  strategy VARCHAR(20) NOT NULL, -- mobile or desktop
  performance_score INTEGER, -- 0-100
  accessibility_score INTEGER, -- 0-100
  best_practices_score INTEGER, -- 0-100
  seo_score INTEGER, -- 0-100
  field_metrics JSONB, -- Real user metrics (CrUX data): LCP, FID/INP, CLS, etc.
  lab_metrics JSONB, -- Lab metrics from Lighthouse: FCP, LCP, TBT, CLS, SI, TTI
  opportunities JSONB, -- Performance improvement opportunities
  diagnostics JSONB, -- Diagnostic information and warnings
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pagespeed_audits_website_id ON pagespeed_audits(website_id);
CREATE INDEX IF NOT EXISTS idx_pagespeed_audits_url ON pagespeed_audits(url);
CREATE INDEX IF NOT EXISTS idx_pagespeed_audits_created_at ON pagespeed_audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pagespeed_audits_strategy ON pagespeed_audits(strategy);
CREATE INDEX IF NOT EXISTS idx_pagespeed_audits_performance_score ON pagespeed_audits(performance_score);

-- Composite index for trend analysis
CREATE INDEX IF NOT EXISTS idx_pagespeed_audits_website_date
ON pagespeed_audits(website_id, created_at DESC);

COMMENT ON TABLE pagespeed_audits IS 'PageSpeed Insights audit results from Google API';
COMMENT ON COLUMN pagespeed_audits.strategy IS 'Device type: mobile or desktop';
COMMENT ON COLUMN pagespeed_audits.field_metrics IS 'Real user metrics from Chrome UX Report (CrUX)';
COMMENT ON COLUMN pagespeed_audits.lab_metrics IS 'Lab metrics from Lighthouse simulated tests';
COMMENT ON COLUMN pagespeed_audits.opportunities IS 'Suggested performance improvements with potential savings';
COMMENT ON COLUMN pagespeed_audits.diagnostics IS 'Diagnostic information, warnings, and issues';

-- =============================================
-- MIGRATION 6: SSL CERTIFICATES
-- =============================================

-- Create ssl_certificates table for SSL certificate monitoring
CREATE TABLE IF NOT EXISTS ssl_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL,
  issuer VARCHAR(255),
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  days_until_expiry INTEGER,
  is_valid BOOLEAN DEFAULT false,
  error_message TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ssl_certificates_website_id ON ssl_certificates(website_id);
CREATE INDEX IF NOT EXISTS idx_ssl_certificates_domain ON ssl_certificates(domain);
CREATE INDEX IF NOT EXISTS idx_ssl_certificates_checked_at ON ssl_certificates(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_ssl_certificates_days_until_expiry ON ssl_certificates(days_until_expiry);
CREATE INDEX IF NOT EXISTS idx_ssl_certificates_valid_to ON ssl_certificates(valid_to);

-- Composite index for latest cert per website
CREATE INDEX IF NOT EXISTS idx_ssl_certificates_website_checked
ON ssl_certificates(website_id, checked_at DESC);

COMMENT ON TABLE ssl_certificates IS 'SSL certificate monitoring and expiry tracking';
COMMENT ON COLUMN ssl_certificates.days_until_expiry IS 'Days remaining until certificate expires (negative if expired)';
COMMENT ON COLUMN ssl_certificates.is_valid IS 'Whether the certificate is currently valid';

-- =============================================
-- MIGRATION 7: GOOGLE SEARCH CONSOLE
-- =============================================

-- =============================================
-- 1. SEARCH CONSOLE QUERIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS search_console_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr DECIMAL(5,4) DEFAULT 0, -- Click-through rate (0.0000 to 1.0000)
  position DECIMAL(5,2) DEFAULT 0, -- Average position in search results
  date DATE NOT NULL,
  country VARCHAR(2), -- ISO country code (TR, US, etc.)
  device VARCHAR(20), -- desktop, mobile, tablet
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(website_id, query, date, country, device)
);

-- Indexes for search console queries
CREATE INDEX IF NOT EXISTS idx_search_console_queries_website_id
  ON search_console_queries(website_id);
CREATE INDEX IF NOT EXISTS idx_search_console_queries_date
  ON search_console_queries(date DESC);
CREATE INDEX IF NOT EXISTS idx_search_console_queries_clicks
  ON search_console_queries(clicks DESC);
CREATE INDEX IF NOT EXISTS idx_search_console_queries_impressions
  ON search_console_queries(impressions DESC);
CREATE INDEX IF NOT EXISTS idx_search_console_queries_position
  ON search_console_queries(position ASC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_search_console_queries_website_date
  ON search_console_queries(website_id, date DESC);

COMMENT ON TABLE search_console_queries IS 'Google Search Console query performance data';
COMMENT ON COLUMN search_console_queries.ctr IS 'Click-through rate (clicks/impressions)';
COMMENT ON COLUMN search_console_queries.position IS 'Average position in Google search results';

-- =============================================
-- 2. SEARCH CONSOLE PAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS search_console_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr DECIMAL(5,4) DEFAULT 0,
  position DECIMAL(5,2) DEFAULT 0,
  date DATE NOT NULL,
  country VARCHAR(2),
  device VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(website_id, page_url, date, country, device)
);

-- Indexes for search console pages
CREATE INDEX IF NOT EXISTS idx_search_console_pages_website_id
  ON search_console_pages(website_id);
CREATE INDEX IF NOT EXISTS idx_search_console_pages_date
  ON search_console_pages(date DESC);
CREATE INDEX IF NOT EXISTS idx_search_console_pages_clicks
  ON search_console_pages(clicks DESC);
CREATE INDEX IF NOT EXISTS idx_search_console_pages_impressions
  ON search_console_pages(impressions DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_search_console_pages_website_date
  ON search_console_pages(website_id, date DESC);

COMMENT ON TABLE search_console_pages IS 'Google Search Console page performance data';

-- =============================================
-- 3. SEARCH CONSOLE SYNC LOG
-- =============================================
CREATE TABLE IF NOT EXISTS search_console_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  sync_date DATE NOT NULL,
  queries_synced INTEGER DEFAULT 0,
  pages_synced INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'success', -- success, error, partial
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_console_sync_log_website_id
  ON search_console_sync_log(website_id);
CREATE INDEX IF NOT EXISTS idx_search_console_sync_log_created_at
  ON search_console_sync_log(created_at DESC);

COMMENT ON TABLE search_console_sync_log IS 'Tracks Search Console data sync operations';

-- =============================================
-- MIGRATION 8: COMPOSITE INDEXES
-- =============================================

-- analytics_events: frequently queried by (website_id, event_type, created_at)
CREATE INDEX IF NOT EXISTS idx_analytics_events_website_type_date
ON analytics_events(website_id, event_type, created_at DESC);

-- error_logs: frequently queried by (website_id, is_resolved, created_at)
CREATE INDEX IF NOT EXISTS idx_error_logs_website_resolved_date
ON error_logs(website_id, is_resolved, created_at DESC);

-- uptime_checks: frequently queried by (website_id, checked_at DESC)
CREATE INDEX IF NOT EXISTS idx_uptime_checks_website_checked
ON uptime_checks(website_id, checked_at DESC);

-- pagespeed_audits: frequently queried by (website_id, strategy, created_at)
CREATE INDEX IF NOT EXISTS idx_pagespeed_audits_website_strategy_date
ON pagespeed_audits(website_id, strategy, created_at DESC);

-- alert_history: queried by (website_id, alert_type, created_at)
CREATE INDEX IF NOT EXISTS idx_alert_history_website_type_date
ON alert_history(website_id, alert_type, created_at DESC);

-- =============================================
-- ✅ MIGRATION COMPLETE!
-- =============================================
-- All tables, indexes, and functions have been created.
-- Your Webmaster Dashboard database is ready to use.
-- =============================================
