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
