-- Google Search Console Tables
-- This migration is idempotent - safe to run multiple times.

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
