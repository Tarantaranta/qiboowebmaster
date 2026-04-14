#!/bin/bash

# ============================================
# Update Dashboard Pages to Use Service Role
# ============================================
# This script updates all dashboard pages to use the service role client
# instead of the anon key for secure data access.

set -e

echo "🔒 Updating dashboard pages to use service role client..."

# List of files to update
files=(
  "app/dashboard/analytics/page.tsx"
  "app/dashboard/errors/page.tsx"
  "app/dashboard/uptime/page.tsx"
  "app/dashboard/performance/page.tsx"
  "app/dashboard/ssl/page.tsx"
  "app/dashboard/chatbot/page.tsx"
  "app/dashboard/seo/page.tsx"
  "app/dashboard/page.tsx"
  "app/dashboard/layout.tsx"
  "app/dashboard/settings/page.tsx"
  "app/dashboard/keywords/page.tsx"
  "app/dashboard/monitoring/page.tsx"
  "app/dashboard/sites/[domain]/page.tsx"
  "app/dashboard/reports/page.tsx"
  "app/dashboard/actions/page.tsx"
  "app/dashboard/funnels/page.tsx"
)

updated=0
skipped=0

for file in "${files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "⏭️  Skipping $file (not found)"
    ((skipped++))
    continue
  fi

  # Check if file uses server client
  if grep -q "from '@/lib/supabase/server'" "$file"; then
    echo "✏️  Updating $file"

    # Create backup
    cp "$file" "$file.backup"

    # Replace import
    sed -i '' "s|from '@/lib/supabase/server'|from '@/lib/supabase/service-role'|g" "$file"

    # Replace function calls
    sed -i '' 's|const supabase = await createClient()|const supabase = createServiceRoleClient()|g' "$file"

    ((updated++))
  else
    echo "⏭️  Skipping $file (already uses service role or different client)"
    ((skipped++))
  fi
done

echo ""
echo "✅ Update complete!"
echo "   Updated: $updated files"
echo "   Skipped: $skipped files"
echo ""
echo "📝 Backups created with .backup extension"
echo "🧪 Test your dashboard before deploying to production"
echo ""
echo "To revert changes: for f in app/dashboard/**/*.backup; do mv \"\$f\" \"\${f%.backup}\"; done"
