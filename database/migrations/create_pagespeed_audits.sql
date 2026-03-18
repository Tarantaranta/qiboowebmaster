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
