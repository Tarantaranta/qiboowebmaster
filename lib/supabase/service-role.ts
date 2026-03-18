import { createClient } from '@supabase/supabase-js'

/**
 * Service Role Client - bypasses RLS for admin operations
 * Use ONLY for server-side API routes that need elevated privileges
 * DO NOT expose this client to the browser
 */
export function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
