-- =============================================
-- WEBMASTER DASHBOARD - DATABASE SCHEMA
-- =============================================
-- This migration is idempotent - safe to run multiple times.

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

-- =============================================
-- ROW LEVEL SECURITY (RLS) - Optional
-- =============================================
-- Multi-user RLS not needed currently (single admin)

COMMENT ON TABLE websites IS 'Monitored websites';
COMMENT ON TABLE uptime_checks IS 'Historical uptime check results';
COMMENT ON TABLE analytics_events IS 'Custom analytics tracking events';
COMMENT ON TABLE chatbot_conversations IS 'Chatbot conversation logs';
COMMENT ON TABLE error_logs IS 'JavaScript and server error logs';
COMMENT ON TABLE alert_settings IS 'Alert configuration per website';
COMMENT ON TABLE vercel_deployments IS 'Vercel deployment history';
COMMENT ON TABLE alert_history IS 'History of sent alerts';
