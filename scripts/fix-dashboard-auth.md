# Dashboard Authentication Fix

## Problem
Dashboard pages use `createClient()` from `lib/supabase/server.ts` which uses the **anon key**. With RLS enabled, anon key cannot read protected data.

## Solution
Update dashboard pages to use the service role client for server-side data fetching.

## Files That Need Updates

### Dashboard Pages (Server Components)
These files currently import from `@/lib/supabase/server` and need to use service role:

1. `app/dashboard/analytics/page.tsx`
2. `app/dashboard/errors/page.tsx`
3. `app/dashboard/uptime/page.tsx`
4. `app/dashboard/performance/page.tsx`
5. `app/dashboard/ssl/page.tsx`
6. `app/dashboard/chatbot/page.tsx`
7. `app/dashboard/seo/page.tsx`
8. `app/dashboard/page.tsx` (main dashboard)

### Change Required

**Before:**
```typescript
import { createClient } from '@/lib/supabase/server'

export default async function MyPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('analytics_events').select('*')
  // ...
}
```

**After:**
```typescript
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export default async function MyPage() {
  const supabase = createServiceRoleClient()
  const { data } = await supabase.from('analytics_events').select('*')
  // ...
}
```

## API Routes That Can Stay As-Is

These routes use anon key for INSERT operations (already allowed by migration):
- `app/api/track/route.ts` - Inserts analytics events ✅
- `app/api/track/error/route.ts` - Inserts error logs ✅
- `app/api/chatbot/log/route.ts` - Inserts chatbot messages ✅

## Long-Term Recommendation

Implement Supabase Authentication:
1. Add sign-in page with email/password
2. Update dashboard layout to require authentication
3. Update RLS policies to use `authenticated` role instead of `service_role`
4. This allows proper user management and audit trails

For now, service role is acceptable for a single-admin dashboard.
