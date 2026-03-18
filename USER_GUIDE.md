# Webmaster App - User Guide

> A guide for using the Webmaster App platform to monitor, analyze, and optimize your websites.

## Table of Contents

- [Getting Started](#getting-started)
- [Adding a New Website](#adding-a-new-website)
- [Installing Tracking Scripts](#installing-tracking-scripts)
- [Dashboard Overview](#dashboard-overview)
- [Reading the Dashboards](#reading-the-dashboards)
  - [Main Dashboard](#main-dashboard)
  - [Uptime Monitoring](#uptime-monitoring)
  - [Analytics](#analytics)
  - [Performance](#performance)
  - [Error Tracking](#error-tracking)
  - [SEO Analysis](#seo-analysis)
  - [SSL Monitoring](#ssl-monitoring)
  - [Chatbot Monitoring](#chatbot-monitoring)
  - [Site-Specific Dashboard](#site-specific-dashboard)
- [Setting Up Alerts](#setting-up-alerts)
- [Google Analytics Integration](#google-analytics-integration)
- [Vercel Deployment Tracking](#vercel-deployment-tracking)

---

## Getting Started

### First-Time Setup

1. Navigate to your Webmaster App URL (e.g., `https://your-app.vercel.app`)
2. You will be redirected to the login page
3. Since no users exist yet, create your admin account:
   - Enter your email and a secure password
   - This is the only account that can be created (single-tenant design)
4. After signing up, you will be logged into the dashboard

### Logging In

1. Go to `/login`
2. Enter your email and password
3. You will be redirected to the main dashboard at `/dashboard`

---

## Adding a New Website

1. From the main dashboard, look for the "Add Website" button or form
2. Fill in the required fields:

| Field | Required | Description |
|---|---|---|
| **Name** | Yes | A friendly name for your website (e.g., "Company Blog") |
| **Domain** | Yes | The domain name without `http://` or `https://` (e.g., `example.com`) |
| **Description** | No | A brief description of the website's purpose |
| **Vercel Project ID** | No | If hosted on Vercel, add the project ID for deployment tracking |
| **GA4 Property ID** | No | Your Google Analytics 4 property ID for analytics integration |

3. Click "Save" or "Add Website"
4. The system automatically creates default alert settings:
   - **Uptime alerts:** Triggers after 5 minutes of downtime
   - **Error alerts:** Triggers when more than 10 errors per hour
   - **SSL expiry alerts:** Sends email 7 days before SSL certificate expires

### Editing a Website

- Navigate to the website's settings
- Update any field (name, domain, description, Vercel project ID, GA property ID)
- Only the fields you change will be updated

### Deleting a Website

- Navigate to the website's settings
- Click the delete option
- **Warning:** This removes the website and all associated monitoring data

---

## Installing Tracking Scripts

To collect analytics, error, and performance data from your websites, you need to install a tracking script on each monitored site.

### Option 1: Simple Tracker (Recommended)

Add this single line to the `<head>` tag of every page on your website:

```html
<script src="https://YOUR-DASHBOARD-URL.vercel.app/track.js" data-site="yourdomain.com"></script>
```

Replace:
- `YOUR-DASHBOARD-URL.vercel.app` with your Webmaster App's URL
- `yourdomain.com` with your website's domain (must match what you entered when adding the website)

**What this tracks:**
- Page views (automatically on page load)
- Time on page (sent when user leaves)
- Scroll depth (maximum scroll percentage)
- External link clicks (automatic detection)

**Custom event tracking:**
```javascript
// Track a custom event
window.webmasterAnalytics.track('button_click', {
  buttonId: 'signup-cta',
  position: 'header'
});
```

### Option 2: Advanced Tracker (with Error & Vitals Tracking)

For comprehensive monitoring including JavaScript error tracking and Core Web Vitals:

```html
<!-- Configuration -->
<script>
  window.WEBMASTER_SITE_ID = 'your-website-uuid-or-domain';
  window.WEBMASTER_API_URL = 'https://YOUR-DASHBOARD-URL.vercel.app';
</script>

<!-- Analytics + Error Tracking -->
<script src="https://YOUR-DASHBOARD-URL.vercel.app/tracking/webmaster-analytics.js" async></script>

<!-- Core Web Vitals (optional) -->
<script src="https://YOUR-DASHBOARD-URL.vercel.app/tracking/webmaster-analytics-vitals.js" async></script>
```

**Additional tracking with the advanced script:**
- JavaScript runtime errors
- Unhandled promise rejections
- Core Web Vitals (LCP, INP, CLS, TTFB, FCP)

### Verifying Installation

After installing the tracking script:

1. Open your website in a browser
2. Open the browser's Developer Tools (F12)
3. Check the Console tab for `[Webmaster Analytics]` messages
4. Check the Network tab for requests to `/api/track`
5. Within a few minutes, data should appear in your Webmaster App dashboard

---

## Dashboard Overview

The Webmaster App has several dashboard pages accessible from the navigation:

| Page | Path | Purpose |
|---|---|---|
| **Main Dashboard** | `/dashboard` | Overview of all websites with key metrics |
| **Uptime** | `/dashboard/uptime` | Uptime monitoring and response times |
| **Analytics** | `/dashboard/analytics` | Traffic, page views, sessions, and visitor data |
| **Performance** | `/dashboard/performance` | Core Web Vitals and PageSpeed scores |
| **Errors** | `/dashboard/errors` | JavaScript error logs and trends |
| **SEO** | (via site dashboard) | SEO audits, keywords, and recommendations |
| **SSL** | `/dashboard/ssl` | SSL certificate expiry monitoring |
| **Chatbot** | `/dashboard/chatbot` | Chatbot conversation logs and health |
| **Monitoring** | `/dashboard/monitoring` | Combined monitoring overview |
| **Site Details** | `/dashboard/sites/[domain]` | Detailed dashboard for a specific website |

---

## Reading the Dashboards

### Main Dashboard

The main dashboard (`/dashboard`) provides an at-a-glance view of all your monitored websites:

- **Website cards** showing status (online/offline/degraded), domain, and last check time
- **Quick stats** like total websites, uptime percentage, recent errors
- **GA4 metrics** if Google Analytics is configured (users, sessions, page views)
- **Chatbot health** indicators for sites with chatbot monitoring

### Uptime Monitoring

The uptime dashboard (`/dashboard/uptime`) shows:

- **Current status** of each website (online, offline, degraded)
- **Response time history** - how fast your sites respond over time
- **Uptime percentage** - calculated from historical checks
- **Status change history** - when sites went down and recovered

**Status meanings:**
| Status | Description |
|---|---|
| **Online** | Website returned HTTP 2xx response |
| **Degraded** | Website returned non-2xx but responded |
| **Offline** | Website failed to respond within 10 seconds |
| **Unknown** | Not yet checked |

### Analytics

The analytics dashboard (`/dashboard/analytics`) displays:

- **Page views** over time (charts)
- **Unique sessions** and visitor counts
- **Device breakdown** (desktop, mobile, tablet)
- **Geographic distribution** of visitors (country-level)
- **Top referrers** - where your traffic comes from
- **Popular pages** - most visited URLs
- **Time on page** and **scroll depth** averages

### Performance

The performance dashboard (`/dashboard/performance`) shows:

- **Core Web Vitals** scores with good/needs-improvement/poor ratings
- **PageSpeed Insights** scores (performance, accessibility, best practices, SEO)
- **Lab metrics** from Lighthouse analysis
- **Field metrics** from real user measurements
- **Improvement opportunities** ranked by potential impact

**Core Web Vitals thresholds:**
| Metric | Good | Needs Improvement | Poor |
|---|---|---|---|
| LCP | < 2.5s | 2.5s - 4.0s | > 4.0s |
| INP | < 200ms | 200ms - 500ms | > 500ms |
| CLS | < 0.1 | 0.1 - 0.25 | > 0.25 |
| TTFB | < 800ms | 800ms - 1800ms | > 1800ms |
| FCP | < 1.8s | 1.8s - 3.0s | > 3.0s |

### Error Tracking

The errors dashboard (`/dashboard/errors`) shows:

- **Error log** with message, type, file, line number, and timestamp
- **Error trends** over time
- **Error grouping** by type/message
- **Resolution status** (resolved/unresolved)
- **Page URL** where each error occurred

### SEO Analysis

SEO features are accessible through site-specific dashboards:

- **SEO Score** (0-100) based on technical audit
- **Issues list** categorized by severity (critical, high, medium, low)
- **AI-powered recommendations** for improvement
- **Keyword tracking** with position monitoring
- **Content analysis** (word count, heading structure, meta tags)

To run an SEO audit:
1. Navigate to a site's dashboard
2. Click "Run SEO Audit"
3. Choose quick or deep analysis mode
4. Review the results including AI-generated recommendations

### SSL Monitoring

The SSL dashboard (`/dashboard/ssl`) tracks:

- **Certificate expiry dates** for all websites
- **Days until expiry** with color-coded warnings
- **SSL validity status**
- Alerts are sent 7 days before certificate expiry (when configured)

### Chatbot Monitoring

The chatbot dashboard (`/dashboard/chatbot`) shows:

- **Conversation logs** with full message history
- **Active sessions** count
- **Message volume** over time
- **Health status** of chatbot endpoints

### Site-Specific Dashboard

Navigate to `/dashboard/sites/[domain]` for a detailed view of a single website with all metrics combined:

- Uptime status and history
- GA4 metrics (if configured)
- Chatbot health
- Recent errors
- Performance scores
- SEO audit results

---

## Setting Up Alerts

The platform supports two alert channels: **Telegram** and **Email**.

### Telegram Alerts

1. Create a Telegram bot via [@BotFather](https://t.me/BotFather):
   - Send `/newbot` to BotFather
   - Follow the prompts to name your bot
   - Copy the bot token
2. Get your chat ID:
   - Send a message to your new bot
   - Visit `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Find `chat.id` in the response
3. Add to your environment variables:
   ```
   TELEGRAM_BOT_TOKEN=your-bot-token
   TELEGRAM_CHAT_ID=your-chat-id
   ```

### Email Alerts

1. Create a Gmail App Password:
   - Go to your Google Account > Security > 2-Step Verification
   - Scroll to "App passwords" and create one for "Mail"
2. Add to your environment variables:
   ```
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-app-password
   ADMIN_EMAIL=recipient@example.com
   ```

### Testing Alerts

Use the alerts test endpoint to verify your configuration:

1. From the dashboard, find the alert testing option
2. Select the channel to test (`telegram`, `email`, or `all`)
3. A test message will be sent to verify connectivity

### Default Alert Rules

When you add a website, three alert rules are created automatically:

| Alert Type | Default Threshold | Channels |
|---|---|---|
| **Uptime** | 5 minutes of downtime | Telegram + Email |
| **Error Rate** | 10+ errors per hour | Telegram + Email |
| **SSL Expiry** | 7 days before expiry | Email only |

---

## Google Analytics Integration

To connect Google Analytics 4 data:

1. **Create a Google Cloud service account:**
   - Go to Google Cloud Console > IAM & Admin > Service Accounts
   - Create a new service account
   - Create a JSON key and download it

2. **Grant access in GA4:**
   - Go to GA4 Admin > Property Access Management
   - Add the service account email as a Viewer

3. **Configure the environment variable:**
   ```
   GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"...","private_key":"..."}
   ```
   (Paste the entire JSON key file content as a single line)

4. **Add the GA4 Property ID** to your website settings:
   - Find your property ID in GA4 Admin > Property Settings
   - Edit your website in the Webmaster App and add the `ga_property_id`

5. GA4 data will now appear in your site-specific dashboards

---

## Vercel Deployment Tracking

To track Vercel deployments:

1. **Generate a Vercel API token:**
   - Go to Vercel Dashboard > Settings > Tokens
   - Create a new token with appropriate scope

2. **Add the environment variable:**
   ```
   VERCEL_API_TOKEN=your-vercel-token
   ```

3. **Add the Vercel Project ID** to your website settings:
   - Find the project ID in Vercel Dashboard > Project Settings > General
   - Edit your website and add the `vercel_project_id`

4. Deployment history will now appear in the monitoring dashboard
