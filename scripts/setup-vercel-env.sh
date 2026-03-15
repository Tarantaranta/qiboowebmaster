#!/bin/bash

# Vercel Environment Variables Setup Script
# This script automatically adds all required environment variables to Vercel

set -e

echo "🚀 Vercel Environment Variables Setup"
echo "======================================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "❌ Error: .env.local file not found!"
  exit 1
fi

echo "📋 Reading environment variables from .env.local..."
echo ""

# Function to add env var to Vercel
add_env_var() {
  local key=$1
  local value=$2

  echo "Adding: $key"

  # Add to production, preview, and development
  echo "$value" | vercel env add "$key" production --yes > /dev/null 2>&1 || echo "  ⚠️  Already exists in production"
  echo "$value" | vercel env add "$key" preview --yes > /dev/null 2>&1 || echo "  ⚠️  Already exists in preview"
  echo "$value" | vercel env add "$key" development --yes > /dev/null 2>&1 || echo "  ⚠️  Already exists in development"

  echo "  ✅ Done"
  echo ""
}

# Read .env.local and add each variable
while IFS='=' read -r key value; do
  # Skip empty lines and comments
  [[ -z "$key" || "$key" =~ ^#.* ]] && continue

  # Remove any quotes from value
  value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")

  # Add to Vercel (only critical ones)
  case "$key" in
    NEXT_PUBLIC_SUPABASE_URL|\
    NEXT_PUBLIC_SUPABASE_ANON_KEY|\
    SUPABASE_SERVICE_ROLE_KEY|\
    CRON_SECRET|\
    TELEGRAM_BOT_TOKEN|\
    TELEGRAM_CHAT_ID|\
    GMAIL_USER|\
    GMAIL_APP_PASSWORD|\
    ADMIN_EMAIL|\
    ADMIN_PHONE|\
    VERCEL_API_TOKEN|\
    ALERT_EMAIL_TO|\
    NEXT_PUBLIC_WEBSITES|\
    OPENAI_API_KEY)
      add_env_var "$key" "$value"
      ;;
  esac
done < .env.local

echo ""
echo "✅ All environment variables added successfully!"
echo ""
echo "🚀 Ready to deploy! Run: vercel --prod"
