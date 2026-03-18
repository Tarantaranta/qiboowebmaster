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
