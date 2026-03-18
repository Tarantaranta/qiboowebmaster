-- Add downtime_started_at column to websites table for accurate downtime duration tracking
ALTER TABLE websites
ADD COLUMN IF NOT EXISTS downtime_started_at TIMESTAMPTZ;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_websites_downtime_started_at ON websites(downtime_started_at);

COMMENT ON COLUMN websites.downtime_started_at IS 'Timestamp when the website went offline (null when online)';
