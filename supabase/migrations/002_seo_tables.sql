-- =============================================
-- SEO TABLES FOR ADVANCED ANALYSIS
-- =============================================

-- =============================================
-- 1. KEYWORDS TABLE
-- =============================================
CREATE TABLE keywords (
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

CREATE INDEX idx_keywords_website_id ON keywords(website_id);
CREATE INDEX idx_keywords_tracking ON keywords(is_tracking) WHERE is_tracking = TRUE;

-- =============================================
-- 2. KEYWORD POSITIONS HISTORY
-- =============================================
CREATE TABLE keyword_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  rank_position INTEGER NOT NULL,
  url TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  search_engine TEXT DEFAULT 'google'
);

CREATE INDEX idx_keyword_positions_keyword_id ON keyword_positions(keyword_id);
CREATE INDEX idx_keyword_positions_checked_at ON keyword_positions(checked_at DESC);

-- =============================================
-- 3. SEO AUDITS TABLE
-- =============================================
CREATE TABLE seo_audits (
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

CREATE INDEX idx_seo_audits_website_id ON seo_audits(website_id);
CREATE INDEX idx_seo_audits_created_at ON seo_audits(created_at DESC);

-- =============================================
-- 4. BACKLINKS TABLE
-- =============================================
CREATE TABLE backlinks (
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

CREATE INDEX idx_backlinks_website_id ON backlinks(website_id);
CREATE INDEX idx_backlinks_is_active ON backlinks(is_active) WHERE is_active = TRUE;

-- =============================================
-- 5. COMPETITORS TABLE
-- =============================================
CREATE TABLE competitors (
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

CREATE INDEX idx_competitors_website_id ON competitors(website_id);

-- =============================================
-- 6. SEO RECOMMENDATIONS TABLE (AI-POWERED)
-- =============================================
CREATE TABLE seo_recommendations (
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

CREATE INDEX idx_seo_recommendations_website_id ON seo_recommendations(website_id);
CREATE INDEX idx_seo_recommendations_priority ON seo_recommendations(priority);
CREATE INDEX idx_seo_recommendations_implemented ON seo_recommendations(is_implemented);

-- =============================================
-- 7. CONTENT SUGGESTIONS TABLE (AI)
-- =============================================
CREATE TABLE content_suggestions (
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

CREATE INDEX idx_content_suggestions_website_id ON content_suggestions(website_id);
CREATE INDEX idx_content_suggestions_created ON content_suggestions(is_created);

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
