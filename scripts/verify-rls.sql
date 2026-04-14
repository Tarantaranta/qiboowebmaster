-- =============================================
-- VERIFY RLS IS ENABLED
-- =============================================
-- Run this in Supabase SQL Editor to verify RLS is working

-- Check which tables have RLS enabled
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- View all active policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Count tables without RLS (should be 0)
SELECT
  COUNT(*) as tables_without_rls
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false;
