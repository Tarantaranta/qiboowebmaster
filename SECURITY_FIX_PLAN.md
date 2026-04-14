# 🔒 Supabase RLS Security Fix - Action Plan

## 🚨 Critical Issue Summary

Your Supabase database has **Row-Level Security (RLS) disabled**, exposing all data to public access. The Supabase team detected:

1. **Tables publicly accessible** - Anyone can read, edit, and delete data
2. **Sensitive data exposed** - IP addresses, user IDs, chatbot conversations, error logs

## ✅ Solution Created

I've created a migration file that:
- Enables RLS on all 20+ tables
- Creates secure policies allowing only service role access
- Allows API endpoints to continue inserting analytics/error data
- Blocks all unauthorized public access

## 📋 Implementation Steps

### Step 1: Apply the RLS Migration

**Option A: Using Supabase CLI** (Recommended)
```bash
# Link to your project
supabase link --project-ref qkpizxniwuglawerqvgi

# Apply the migration
supabase db push
```

**Option B: Manual SQL**
1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/qkpizxniwuglawerqvgi/editor)
2. Copy contents of `supabase/migrations/003_enable_rls_security.sql`
3. Run the SQL

### Step 2: Update Dashboard Pages

Dashboard pages currently use the anon key which won't work with RLS. Run the automated fix:

```bash
# Run the update script
./scripts/update-dashboard-to-service-role.sh

# Review changes
git diff app/dashboard/

# Test locally
npm run dev
```

**What it does:**
- Updates all dashboard pages to use `createServiceRoleClient()`
- Creates backups of original files
- Allows dashboard to bypass RLS for admin access

### Step 3: Verify Security

Run verification SQL:
```bash
# Check RLS status
cat scripts/verify-rls.sql
```

Or in Supabase SQL Editor:
```sql
-- Should show rls_enabled = true for all tables
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Step 4: Test Everything

```bash
# Test locally first
npm run dev

# Visit each dashboard page:
# - http://localhost:3000/dashboard
# - http://localhost:3000/dashboard/analytics
# - http://localhost:3000/dashboard/errors
# - http://localhost:3000/dashboard/uptime

# Test API endpoints
curl -X POST http://localhost:3000/api/track \
  -H "Content-Type: application/json" \
  -d '{"siteId":"drkeremal.com","eventType":"pageview","sessionId":"test","url":"/test"}'
```

### Step 5: Deploy

```bash
# Commit changes
git add .
git commit -m "security: Enable RLS and update dashboard to use service role"

# Push to production
git push
```

## 🔐 Security Policies Created

| Table | Anon (Public) | Service Role (Your App) |
|-------|---------------|-------------------------|
| **websites** | SELECT only | Full access |
| **analytics_events** | INSERT only | Full access |
| **error_logs** | INSERT only | Full access |
| **chatbot_conversations** | INSERT/UPDATE | Full access |
| **uptime_checks** | ❌ Denied | Full access |
| **keywords** | ❌ Denied | Full access |
| **seo_audits** | ❌ Denied | Full access |
| All other tables | ❌ Denied | Full access |

## 📁 Files Created

1. **`supabase/migrations/003_enable_rls_security.sql`**
   - Enables RLS on all tables
   - Creates security policies
   - Idempotent (safe to run multiple times)

2. **`scripts/update-dashboard-to-service-role.sh`**
   - Automated script to fix dashboard pages
   - Creates backups before modifying

3. **`scripts/verify-rls.sql`**
   - SQL queries to verify RLS is working

4. **`scripts/fix-dashboard-auth.md`**
   - Manual instructions if you prefer to update files yourself

## ⚠️ Important Notes

### API Routes That Still Use Anon Key (By Design)
These routes receive data from external websites and need to use the anon key:
- `/api/track` - Analytics tracking
- `/api/track/error` - Error logging
- `/api/chatbot/log` - Chatbot messages

**These are allowed by the migration** via specific INSERT policies.

### Environment Variables Required
Make sure you have these set in production (Vercel):
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://qkpizxniwuglawerqvgi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 🎯 Long-Term Recommendations

1. **Implement Supabase Authentication**
   - Add proper login system
   - Use `authenticated` role instead of `service_role` for dashboards
   - Better security and audit trails

2. **Add API Key Authentication**
   - For tracking endpoints, consider requiring API keys
   - Prevents abuse of your analytics endpoints

3. **Monitor Database Access**
   - Set up Supabase alerts for unusual activity
   - Review Supabase logs regularly

4. **Regular Security Audits**
   - Review RLS policies quarterly
   - Test for unauthorized access

## 🆘 Troubleshooting

### If Dashboard Shows "No Data"
- Check that service role key is set in `.env.local`
- Verify dashboard pages use `createServiceRoleClient()`
- Check browser console for errors

### If API Tracking Fails
- Verify anon key is correct in `.env.local`
- Check Supabase logs for policy violations
- Ensure policies allow INSERT for anon on analytics_events

### To Rollback
```bash
# Restore original files
for f in app/dashboard/**/*.backup; do
  mv "$f" "${f%.backup}"
done

# Disable RLS (NOT RECOMMENDED)
# Only use if you need to rollback while fixing issues
supabase db reset
```

## ✅ Success Checklist

- [ ] Migration applied successfully
- [ ] Dashboard pages updated to use service role
- [ ] All dashboard pages load correctly
- [ ] Analytics tracking still works
- [ ] Error logging still works
- [ ] RLS verification shows all tables protected
- [ ] Deployed to production
- [ ] Supabase security warnings resolved

## 📞 Support

- Supabase RLS Docs: https://supabase.com/docs/guides/auth/row-level-security
- Supabase Discord: https://discord.supabase.com
- Project Dashboard: https://supabase.com/dashboard/project/qkpizxniwuglawerqvgi
