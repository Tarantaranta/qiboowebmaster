-- Fix country column size in search_console tables
-- Run this in Supabase SQL Editor

-- Increase country column size from VARCHAR(2) to VARCHAR(10)
ALTER TABLE search_console_queries
ALTER COLUMN country TYPE VARCHAR(10);

ALTER TABLE search_console_pages
ALTER COLUMN country TYPE VARCHAR(10);

-- Verify the change
SELECT
  table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name IN ('search_console_queries', 'search_console_pages')
  AND column_name = 'country';
