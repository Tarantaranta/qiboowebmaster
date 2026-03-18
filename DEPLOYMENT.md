# Webmaster App - Deployment Guide

> Step-by-step instructions for deploying the Webmaster App to Vercel with Supabase.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Supabase Setup](#supabase-setup)
- [Environment Variables](#environment-variables)
- [Vercel Deployment](#vercel-deployment)
- [Database Migrations](#database-migrations)
- [Cron Jobs Configuration](#cron-jobs-configuration)
- [Post-Deployment Checklist](#post-deployment-checklist)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ installed locally
- A [Vercel](https://vercel.com/) account (Hobby or Pro plan)
- A [Supabase](https://supabase.com/) account and project
- (Optional) [OpenAI](https://platform.openai.com/) API key for AI-powered SEO analysis
- (Optional) Google Cloud service account for GA4 integration
- (Optional) Telegram bot for alert notifications
- (Optional) Gmail account with app password for email alerts
- (Optional) Vercel API token for deployment tracking
- (Optional) Google PageSpeed Insights API key

---

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com/) and create a new project
2. Choose a region close to your target audience
3. Set a strong database password
4. Wait for the project to initialize

### 2. Get Your Credentials

From your Supabase project dashboard, navigate to **Settings > API**:

- **Project URL** -> `NEXT_PUBLIC_SUPABASE_URL`
- **Anon (public) key** -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Service role key** -> `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### 3. Create Database Tables

Run the following SQL in the Supabase SQL Editor (**SQL Editor > New Query**) to create the required tables:

```sql
-- Websites table
CREATE TABLE IF NOT EXISTS websites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  vercel_project_id TEXT,
  ga_property_id TEXT,
  status TEXT DEFAULT 'unknown',
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  country TEXT,
  device_type TEXT,
  session_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Error logs
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  page_url TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  is_resolved BOOLEAN DEFAULT FALSE,
  notified_via_sms BOOLEAN DEFAULT FALSE,
  notified_via_email BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Uptime checks
CREATE TABLE IF NOT EXISTS uptime_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  is_up BOOLEAN NOT NULL,
  status_code INTEGER,
  response_time INTEGER,
  error_message TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance metrics (Web Vitals)
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  page_url TEXT,
  metric_name TEXT NOT NULL,
  metric_value FLOAT NOT NULL,
  rating TEXT,
  delta FLOAT,
  metric_id TEXT,
  navigation_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEO audits
CREATE TABLE IF NOT EXISTS seo_audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  score INTEGER,
  issues JSONB DEFAULT '[]',
  ai_analysis TEXT,
  meta_title TEXT,
  meta_description TEXT,
  h1_tags JSONB DEFAULT '[]',
  h2_tags JSONB DEFAULT '[]',
  word_count INTEGER,
  internal_links_count INTEGER,
  external_links_count INTEGER,
  images_count INTEGER,
  images_without_alt INTEGER,
  https_enabled BOOLEAN,
  mobile_friendly BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Keywords
CREATE TABLE IF NOT EXISTS keywords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  search_volume INTEGER,
  difficulty INTEGER,
  current_position INTEGER,
  is_tracking BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(website_id, keyword)
);

-- SEO recommendations
CREATE TABLE IF NOT EXISTS seo_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  category TEXT,
  priority TEXT,
  title TEXT NOT NULL,
  description TEXT,
  impact_score INTEGER,
  effort_score INTEGER,
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert settings
CREATE TABLE IF NOT EXISTS alert_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  telegram_enabled BOOLEAN DEFAULT FALSE,
  email_enabled BOOLEAN DEFAULT FALSE,
  threshold JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chatbot conversations
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  messages JSONB DEFAULT '[]',
  message_count INTEGER DEFAULT 0,
  user_info JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vercel deployments
CREATE TABLE IF NOT EXISTS vercel_deployments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  deployment_id TEXT NOT NULL UNIQUE,
  deployment_url TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- PageSpeed audits
CREATE TABLE IF NOT EXISTS pagespeed_audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  strategy TEXT DEFAULT 'mobile',
  performance_score INTEGER,
  accessibility_score INTEGER,
  best_practices_score INTEGER,
  seo_score INTEGER,
  field_metrics JSONB DEFAULT '{}',
  lab_metrics JSONB DEFAULT '{}',
  opportunities JSONB DEFAULT '[]',
  diagnostics JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_website_id ON analytics_events(website_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_website_id ON error_logs(website_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_uptime_checks_website_id ON uptime_checks(website_id);
CREATE INDEX IF NOT EXISTS idx_uptime_checks_checked_at ON uptime_checks(checked_at);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_website_id ON performance_metrics(website_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_website_session ON chatbot_conversations(website_id, session_id);
```

### 4. Configure Row Level Security (RLS)

Enable RLS on tables and set appropriate policies. For a single-tenant setup, you can allow authenticated users full access:

```sql
-- Enable RLS on all tables
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE uptime_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vercel_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagespeed_audits ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access (single-tenant)
CREATE POLICY "Authenticated users have full access" ON websites
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access" ON analytics_events
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access" ON error_logs
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access" ON uptime_checks
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access" ON performance_metrics
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access" ON seo_audits
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access" ON keywords
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access" ON seo_recommendations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access" ON alert_settings
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access" ON chatbot_conversations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access" ON vercel_deployments
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access" ON pagespeed_audits
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow public insert for tracking endpoints (no auth required)
CREATE POLICY "Public can insert analytics events" ON analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can insert error logs" ON error_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can insert performance metrics" ON performance_metrics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can manage chatbot conversations" ON chatbot_conversations
  FOR ALL USING (true);
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | `eyJhbGciOi...` |
| `CRON_SECRET` | Secret for authenticating cron job requests | `my-secure-cron-secret-123` |

### Optional Variables

| Variable | Description | Used By |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI API key for AI-powered SEO | SEO analysis, keyword recommendations |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Google service account JSON (single line) | Google Analytics 4 integration |
| `GOOGLE_PAGESPEED_API_KEY` | Google PageSpeed Insights API key | PageSpeed audits |
| `VERCEL_API_TOKEN` | Vercel API token | Deployment tracking |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | Alert notifications |
| `TELEGRAM_CHAT_ID` | Telegram chat ID for alerts | Alert notifications |
| `GMAIL_USER` | Gmail address for sending alerts | Email alerts |
| `GMAIL_APP_PASSWORD` | Gmail app password (16 characters) | Email alerts |
| `ADMIN_EMAIL` | Admin email for receiving alerts | Email alerts |
| `ALERT_EMAIL_TO` | Recipient email for alerts (defaults to GMAIL_USER) | Email alerts |
| `NEXT_PUBLIC_SITE_URL` | Public URL of the app | Redirects, absolute URLs |
| `NEXT_PUBLIC_WEBSITES` | Comma-separated list of monitored domains | Client-side reference |

### Setting Environment Variables on Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings > Environment Variables**
3. Add each variable with appropriate scope (Production, Preview, Development)
4. Redeploy after adding variables

---

## Vercel Deployment

### Option 1: Deploy via Git (Recommended)

1. Push your code to a GitHub, GitLab, or Bitbucket repository
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Configure the project:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `.` (default)
   - **Build Command:** `next build` (default)
   - **Output Directory:** `.next` (default)
5. Add all required environment variables
6. Click **Deploy**

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (from project root)
vercel

# Deploy to production
vercel --prod
```

### Build Configuration

The project uses these npm scripts:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

---

## Cron Jobs Configuration

Cron jobs are configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/smart-health-check",
      "schedule": "0 12 * * *"
    },
    {
      "path": "/api/cron/uptime-check",
      "schedule": "0 0 * * *"
    }
  ]
}
```

| Cron Job | Schedule | Description |
|---|---|---|
| Smart Health Check | Daily at 12:00 UTC | Adaptive monitoring - checks sites based on activity |
| Uptime Check | Daily at 00:00 UTC | Full uptime check for all websites |

### Adding PageSpeed Cron (Optional)

To enable daily PageSpeed audits, add to `vercel.json`:

```json
{
  "path": "/api/cron/pagespeed-check",
  "schedule": "0 6 * * *"
}
```

**Note:** Vercel Hobby plan allows up to 2 cron jobs. Pro plan allows up to 40.

### Cron Authentication

All cron endpoints require the `CRON_SECRET` environment variable. Vercel automatically sends the `Authorization: Bearer <CRON_SECRET>` header when invoking cron jobs.

---

## Post-Deployment Checklist

After deploying, verify the following:

### 1. Application Health
- [ ] Visit your deployment URL and confirm the login page loads
- [ ] Create your admin account via the signup flow
- [ ] Log in and verify the dashboard renders correctly

### 2. Database Connectivity
- [ ] Confirm websites can be created (POST /api/websites)
- [ ] Confirm websites list loads (GET /api/websites)

### 3. Tracking Endpoints
- [ ] Test analytics tracking: `curl -X POST https://YOUR-APP.vercel.app/api/track -H "Content-Type: application/json" -d '{"siteId":"test.com","eventType":"pageview"}'`
- [ ] Test error tracking: `curl -X POST https://YOUR-APP.vercel.app/api/track/error -H "Content-Type: application/json" -d '{"siteId":"test.com","errorMessage":"test"}'`

### 4. Cron Jobs
- [ ] Test uptime check: `curl https://YOUR-APP.vercel.app/api/cron/uptime-check -H "Authorization: Bearer YOUR_CRON_SECRET"`
- [ ] Verify cron jobs appear in Vercel Dashboard > Cron Jobs

### 5. Alert Channels (Optional)
- [ ] Test Telegram alerts: `curl -X POST https://YOUR-APP.vercel.app/api/alerts/test -H "Content-Type: application/json" -b "cookies.txt" -d '{"type":"telegram"}'`
- [ ] Test email alerts: `curl -X POST https://YOUR-APP.vercel.app/api/alerts/test -H "Content-Type: application/json" -b "cookies.txt" -d '{"type":"email"}'`

### 6. External Integrations (Optional)
- [ ] Verify Google Analytics data loads if `ga_property_id` and credentials are configured
- [ ] Verify Vercel deployments load if `vercel_project_id` and token are configured
- [ ] Verify PageSpeed analysis works if API key is configured

### 7. Install Tracking Scripts
- [ ] Add tracking script to all monitored websites
- [ ] Verify data appears in the analytics dashboard within a few minutes

---

## Troubleshooting

### Common Issues

**"Supabase connection failed"**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check that your Supabase project is active (not paused)

**"Unauthorized" on cron endpoints**
- Ensure `CRON_SECRET` environment variable is set on Vercel
- Verify the Authorization header matches: `Bearer <CRON_SECRET>`

**Tracking data not appearing**
- Check browser console for errors from the tracking script
- Verify the `data-site` attribute matches the domain in your website settings
- Check that RLS policies allow public inserts on tracking tables

**Google Analytics "not configured"**
- Ensure `GOOGLE_APPLICATION_CREDENTIALS_JSON` contains valid JSON
- Verify the service account has Viewer access to the GA4 property
- Check that the `ga_property_id` on the website matches the GA4 property

**Email alerts not sending**
- Verify `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set
- Ensure 2-Factor Authentication is enabled on the Gmail account
- Create an "App Password" specifically for this application

**Telegram alerts not sending**
- Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set
- Send a message to the bot first (bots cannot initiate conversations)
- Use the `/api/alerts/test` endpoint to diagnose
