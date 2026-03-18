-- Add composite indexes for common query patterns
-- This migration is idempotent - safe to run multiple times.

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
