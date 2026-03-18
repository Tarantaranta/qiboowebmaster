# Webmaster App

A comprehensive website monitoring and management platform built with Next.js, Supabase, and AI-powered analytics.

## Features

- **Uptime Monitoring** - Automated health checks with downtime/recovery alerts via Telegram and email
- **Analytics Tracking** - Lightweight client-side tracking for page views, sessions, scroll depth, and click events with geo-location
- **Error Tracking** - Real-time JavaScript error logging with stack traces and alert triggering
- **Core Web Vitals** - Track LCP, INP, CLS, TTFB, and FCP from real users
- **PageSpeed Insights** - Automated Lighthouse audits for performance, accessibility, best practices, and SEO
- **SEO Analysis** - Technical SEO audits with AI-powered recommendations (OpenAI)
- **Keyword Tracking** - Monitor keyword positions and get AI-generated keyword suggestions
- **Google Analytics 4 Integration** - Pull GA4 metrics directly into the dashboard
- **SSL Certificate Monitoring** - Track certificate expiry with alerts
- **Chatbot Monitoring** - Log and monitor chatbot conversations across websites
- **Vercel Deployment Tracking** - View deployment history and status
- **Smart Health Checks** - Adaptive monitoring that reduces unnecessary checks based on site activity

## Tech Stack

| Component | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Database | [Supabase](https://supabase.com/) (PostgreSQL) |
| Authentication | Supabase Auth |
| AI | [OpenAI](https://openai.com/) (SEO analysis, keyword suggestions) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Charts | [Recharts](https://recharts.org/) |
| Deployment | [Vercel](https://vercel.com/) |
| Alerts | Telegram Bot API, Gmail SMTP (Nodemailer) |

## Quick Start

### Prerequisites

- Node.js 18+
- A Supabase project
- (Optional) OpenAI API key, Google Cloud service account, Vercel API token

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd webmaster_app

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Edit .env.local with your credentials
# (see DEPLOYMENT.md for details)

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

### First-Time Setup

1. Navigate to the login page
2. Create your admin account (only one user is allowed - single-tenant design)
3. Add your websites from the dashboard
4. Install tracking scripts on your websites (see USER_GUIDE.md)

## Project Structure

```
webmaster_app/
├── app/
│   ├── api/                    # API route handlers
│   │   ├── auth/               # Authentication (signup, logout)
│   │   ├── websites/           # Website CRUD operations
│   │   ├── track/              # Analytics, error, and vitals tracking
│   │   ├── seo/                # SEO analysis, keywords, recommendations
│   │   ├── pagespeed/          # PageSpeed Insights integration
│   │   ├── google-analytics/   # GA4 data API
│   │   ├── chatbot/            # Chatbot logging and testing
│   │   ├── vercel/             # Vercel deployment tracking
│   │   ├── alerts/             # Alert testing
│   │   └── cron/               # Scheduled jobs (uptime, health, pagespeed)
│   ├── dashboard/              # Dashboard pages
│   │   ├── analytics/          # Analytics dashboard
│   │   ├── chatbot/            # Chatbot monitoring
│   │   ├── errors/             # Error tracking dashboard
│   │   ├── monitoring/         # Combined monitoring view
│   │   ├── performance/        # Web Vitals & PageSpeed
│   │   ├── sites/[domain]/     # Per-site detailed dashboard
│   │   ├── ssl/                # SSL certificate monitoring
│   │   └── uptime/             # Uptime monitoring
│   └── login/                  # Login page
├── lib/                        # Shared libraries
│   ├── alerts/                 # Telegram, email, and trigger logic
│   ├── analytics/              # Metrics calculations
│   ├── geo/                    # IP geolocation (geoip-lite)
│   ├── monitoring/             # Uptime and SSL check logic
│   ├── supabase/               # Supabase client (server & browser)
│   ├── vercel/                 # Vercel API client
│   └── openai.ts               # OpenAI integration
├── public/
│   ├── track.js                # Simple analytics tracking script
│   └── tracking/               # Advanced tracking scripts (analytics + vitals)
├── vercel.json                 # Cron job configuration
└── package.json
```

## Documentation

| Document | Description |
|---|---|
| [DOCS.md](./DOCS.md) | Complete API reference with endpoints, request/response formats, and curl examples |
| [USER_GUIDE.md](./USER_GUIDE.md) | How to use the platform: adding websites, installing trackers, reading dashboards, setting up alerts |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deployment guide: Vercel setup, environment variables, database migrations, post-deployment checklist |

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## License

Private project.
