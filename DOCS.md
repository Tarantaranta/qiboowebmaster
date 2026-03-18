# Webmaster App - API Documentation

> Comprehensive API reference for the Webmaster App platform.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Error Handling](#error-handling)
- [API Endpoints](#api-endpoints)
  - [Authentication](#1-authentication)
  - [Websites](#2-websites)
  - [Analytics Tracking](#3-analytics-tracking)
  - [Error Tracking](#4-error-tracking)
  - [Web Vitals](#5-web-vitals)
  - [SEO](#6-seo)
  - [PageSpeed](#7-pagespeed)
  - [Google Analytics](#8-google-analytics)
  - [Chatbot](#9-chatbot)
  - [Vercel Deployments](#10-vercel-deployments)
  - [Alerts](#11-alerts)
  - [Cron Jobs](#12-cron-jobs)

---

## Overview

The Webmaster App API is built on Next.js App Router (route handlers). All endpoints follow RESTful conventions and return JSON responses. The API provides functionality for website monitoring, analytics, SEO analysis, performance tracking, and alerting.

**Tech Stack:**
- **Runtime:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **AI:** OpenAI API (SEO analysis, keyword suggestions)
- **External APIs:** Google Analytics 4 Data API, Google PageSpeed Insights, Vercel API, Telegram Bot API

---

## Authentication

Most dashboard-facing endpoints use **Supabase session-based authentication** via cookies. The Supabase client is created server-side using `createClient()` from `@/lib/supabase/server`, which automatically reads the user's session from cookies.

**Public endpoints** (no authentication required):
- `POST /api/track` - Analytics event tracking
- `POST /api/track/error` - Error tracking
- `POST /api/track/vitals` - Web Vitals tracking
- `POST /api/chatbot/log` - Chatbot conversation logging

**Cron endpoints** use Bearer token authentication:
```
Authorization: Bearer <CRON_SECRET>
```

---

## Base URL

| Environment | URL |
|---|---|
| Local Development | `http://localhost:3000` |
| Production (Vercel) | `https://your-app.vercel.app` |

---

## Error Handling

All endpoints return errors in a consistent format:

```json
{
  "error": "Human-readable error message"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request - Missing or invalid parameters |
| `401` | Unauthorized - Invalid or missing authentication |
| `403` | Forbidden - Action not allowed |
| `404` | Not Found |
| `409` | Conflict - Duplicate resource |
| `500` | Internal Server Error |

---

## API Endpoints

### 1. Authentication

#### POST /api/auth/signup

Create the first admin user. Registration is closed after the first user is created (single-tenant design).

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "your-secure-password"
}
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "admin@example.com"
  }
}
```

**Error (403) - User already exists:**
```json
{
  "error": "Kayit kapali - kullanici zaten mevcut"
}
```

**curl:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "securepassword123"}'
```

---

#### POST /api/auth/logout

Sign out the current user. Redirects to `/login`.

**Request:** No body required.

**Response:** `302 Redirect` to `/login`

**curl:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b "cookies.txt" -c "cookies.txt" -L
```

---

### 2. Websites

#### GET /api/websites

List all websites ordered by creation date (newest first).

**Authentication:** Required (Supabase session)

**Response (200):**
```json
{
  "websites": [
    {
      "id": "uuid",
      "name": "My Website",
      "domain": "example.com",
      "description": "Main company website",
      "vercel_project_id": "prj_xxxx",
      "ga_property_id": "123456789",
      "status": "online",
      "created_at": "2025-01-01T00:00:00Z",
      "last_checked_at": "2025-01-15T12:00:00Z"
    }
  ]
}
```

**curl:**
```bash
curl http://localhost:3000/api/websites \
  -b "cookies.txt"
```

---

#### POST /api/websites

Create a new website. Automatically creates default alert settings (uptime, error, SSL expiry).

**Authentication:** Required (Supabase session)

**Request:**
```json
{
  "name": "My Website",
  "domain": "example.com",
  "description": "Optional description",
  "vercel_project_id": "prj_xxxx",
  "ga_property_id": "123456789"
}
```

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Display name for the website |
| `domain` | Yes | Domain name (http/https prefix and trailing slash are auto-stripped) |
| `description` | No | Website description |
| `vercel_project_id` | No | Vercel project ID for deployment tracking |
| `ga_property_id` | No | Google Analytics 4 property ID |

**Response (201):**
```json
{
  "website": {
    "id": "uuid",
    "name": "My Website",
    "domain": "example.com",
    "status": "unknown"
  }
}
```

**Error (409):**
```json
{
  "error": "Domain already exists"
}
```

**curl:**
```bash
curl -X POST http://localhost:3000/api/websites \
  -H "Content-Type: application/json" \
  -b "cookies.txt" \
  -d '{"name": "My Website", "domain": "example.com"}'
```

---

#### GET /api/websites/:id

Get a single website by ID.

**Authentication:** Required (Supabase session)

**Response (200):**
```json
{
  "website": {
    "id": "uuid",
    "name": "My Website",
    "domain": "example.com",
    "description": "",
    "vercel_project_id": null,
    "ga_property_id": null,
    "status": "online",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

**curl:**
```bash
curl http://localhost:3000/api/websites/WEBSITE_UUID \
  -b "cookies.txt"
```

---

#### PATCH /api/websites/:id

Update a website. Only provided fields are updated.

**Authentication:** Required (Supabase session)

**Request:**
```json
{
  "name": "Updated Name",
  "domain": "newdomain.com",
  "description": "Updated description",
  "vercel_project_id": "prj_xxxx",
  "ga_property_id": "123456789"
}
```

**Response (200):**
```json
{
  "website": { ... }
}
```

**curl:**
```bash
curl -X PATCH http://localhost:3000/api/websites/WEBSITE_UUID \
  -H "Content-Type: application/json" \
  -b "cookies.txt" \
  -d '{"name": "Updated Name"}'
```

---

#### DELETE /api/websites/:id

Delete a website and all associated data.

**Authentication:** Required (Supabase session)

**Response (200):**
```json
{
  "success": true
}
```

**curl:**
```bash
curl -X DELETE http://localhost:3000/api/websites/WEBSITE_UUID \
  -b "cookies.txt"
```

---

### 3. Analytics Tracking

#### POST /api/track

Track analytics events (pageviews, clicks, etc.) from client websites. This is a **public endpoint** called by the tracking script.

**Authentication:** None (public)

**Request:**
```json
{
  "siteId": "example.com",
  "eventType": "pageview",
  "sessionId": "sess_abc123",
  "url": "https://example.com/page",
  "referrer": "https://google.com",
  "userAgent": "Mozilla/5.0...",
  "deviceType": "desktop",
  "timestamp": "2025-01-15T12:00:00Z",
  "pageTitle": "My Page",
  "clickType": "external_link",
  "targetUrl": "https://other.com",
  "linkText": "Click here",
  "eventName": "custom_event",
  "timeOnPage": 120,
  "scrollDepth": 85
}
```

| Field | Required | Description |
|---|---|---|
| `siteId` | Yes | Domain name or website UUID |
| `eventType` | Yes | Event type: `pageview`, `page_exit`, `click`, `chatbot`, etc. |
| `sessionId` | No | Client-generated session ID |
| `url` | No | Current page URL |
| `referrer` | No | Referrer URL |
| `deviceType` | No | `desktop`, `mobile`, or `tablet` |
| `timeOnPage` | No | Time spent on page in seconds |
| `scrollDepth` | No | Maximum scroll depth percentage (0-100) |

**Note:** The server automatically detects the client's IP address and resolves geo-location (country, city, region) using the `geoip-lite` library.

**Response (200):**
```json
{
  "success": true
}
```

**curl:**
```bash
curl -X POST http://localhost:3000/api/track \
  -H "Content-Type: application/json" \
  -d '{"siteId": "example.com", "eventType": "pageview", "url": "https://example.com"}'
```

---

### 4. Error Tracking

#### POST /api/track/error

Track JavaScript errors from client websites. Triggers error rate alerting if thresholds are exceeded.

**Authentication:** None (public)

**Request:**
```json
{
  "siteId": "example.com",
  "url": "https://example.com/page",
  "userAgent": "Mozilla/5.0...",
  "errorMessage": "Uncaught TypeError: Cannot read property 'x' of undefined",
  "errorType": "JavaScript Error",
  "stack": "TypeError: Cannot read property...\n    at main.js:42:15",
  "filename": "main.js",
  "lineno": 42,
  "colno": 15,
  "timestamp": "2025-01-15T12:00:00Z"
}
```

| Field | Required | Description |
|---|---|---|
| `siteId` | Yes | Domain name or website UUID |
| `errorMessage` | Yes | Error message string |
| `errorType` | No | Error classification (defaults to "JavaScript Error") |
| `stack` | No | Stack trace |
| `filename` | No | Source file where error occurred |
| `lineno` | No | Line number |
| `colno` | No | Column number |

**Response (200):**
```json
{
  "success": true
}
```

**curl:**
```bash
curl -X POST http://localhost:3000/api/track/error \
  -H "Content-Type: application/json" \
  -d '{"siteId": "example.com", "errorMessage": "Test error"}'
```

---

### 5. Web Vitals

#### POST /api/track/vitals

Track Core Web Vitals performance metrics from client websites.

**Authentication:** None (public)

**Tracked Metrics:**
| Metric | Description | Good Threshold |
|---|---|---|
| `LCP` | Largest Contentful Paint | < 2.5s |
| `INP` | Interaction to Next Paint | < 200ms |
| `CLS` | Cumulative Layout Shift | < 0.1 |
| `TTFB` | Time to First Byte | < 800ms |
| `FCP` | First Contentful Paint | < 1.8s |

**Request:**
```json
{
  "siteId": "example.com",
  "url": "https://example.com/page",
  "metric": "LCP",
  "value": 2100,
  "rating": "good",
  "delta": 50,
  "id": "v4-1234567890",
  "navigationType": "navigate"
}
```

| Field | Required | Description |
|---|---|---|
| `siteId` | Yes | Domain name or website UUID |
| `metric` | Yes | Metric name: `LCP`, `INP`, `CLS`, `TTFB`, `FCP` |
| `value` | Yes | Metric value (ms for timing metrics, unitless for CLS) |
| `rating` | No | `good`, `needs-improvement`, or `poor` |
| `delta` | No | Change since last measurement |
| `navigationType` | No | `navigate`, `reload`, `back-forward`, `prerender` |

**Response (200):**
```json
{
  "success": true
}
```

**curl:**
```bash
curl -X POST http://localhost:3000/api/track/vitals \
  -H "Content-Type: application/json" \
  -d '{"siteId": "example.com", "metric": "LCP", "value": 2100, "rating": "good"}'
```

---

### 6. SEO

#### POST /api/seo/analyze

Run an SEO audit on a URL. Fetches the page, extracts metadata, calculates an SEO score, and provides AI-powered analysis.

**Authentication:** Required (Supabase session)

**Request:**
```json
{
  "website_id": "uuid",
  "url": "https://example.com",
  "mode": "quick"
}
```

| Field | Required | Description |
|---|---|---|
| `website_id` | Yes | Website UUID |
| `url` | Yes | URL to analyze |
| `mode` | No | `quick` (default) or `deep` - controls AI analysis depth |

**What is checked:**
- Title tag (presence, length 30-60 chars)
- Meta description (presence, length > 120 chars)
- H1 tags (exactly 1 recommended)
- Canonical URL
- Schema.org / JSON-LD structured data
- Open Graph tags
- Images without alt text
- WebP image usage
- Content word count (min 300 words)
- Internal/external links
- HTTPS usage

**Response (200):**
```json
{
  "audit": {
    "id": "uuid",
    "website_id": "uuid",
    "url": "https://example.com",
    "score": 78,
    "issues": [
      {
        "type": "technical",
        "severity": "high",
        "message": "Schema.org structured data missing"
      }
    ],
    "ai_analysis": "AI-generated SEO recommendations...",
    "meta_title": "Example Page",
    "meta_description": "Page description...",
    "h1_tags": ["Main Heading"],
    "h2_tags": ["Sub Heading 1", "Sub Heading 2"],
    "word_count": 450,
    "internal_links_count": 5,
    "external_links_count": 3,
    "images_count": 8,
    "images_without_alt": 2,
    "https_enabled": true
  }
}
```

**curl:**
```bash
curl -X POST http://localhost:3000/api/seo/analyze \
  -H "Content-Type: application/json" \
  -b "cookies.txt" \
  -d '{"website_id": "WEBSITE_UUID", "url": "https://example.com"}'
```

---

#### GET /api/seo/keywords

Get tracked keywords for a website, ordered by current position.

**Authentication:** Required (Supabase session)

**Query Parameters:**
| Parameter | Required | Description |
|---|---|---|
| `website_id` | Yes | Website UUID |

**Response (200):**
```json
{
  "keywords": [
    {
      "id": "uuid",
      "website_id": "uuid",
      "keyword": "web development",
      "search_volume": 5000,
      "difficulty": 45,
      "current_position": 12,
      "is_tracking": true
    }
  ]
}
```

**curl:**
```bash
curl "http://localhost:3000/api/seo/keywords?website_id=WEBSITE_UUID" \
  -b "cookies.txt"
```

---

#### POST /api/seo/keywords

Add a keyword to track for a website.

**Authentication:** Required (Supabase session)

**Request:**
```json
{
  "website_id": "uuid",
  "keyword": "web development",
  "search_volume": 5000,
  "difficulty": 45
}
```

| Field | Required | Description |
|---|---|---|
| `website_id` | Yes | Website UUID |
| `keyword` | Yes | Keyword to track (auto-lowercased and trimmed) |
| `search_volume` | No | Monthly search volume |
| `difficulty` | No | Keyword difficulty score (0-100) |

**Response (201):**
```json
{
  "keyword": {
    "id": "uuid",
    "keyword": "web development",
    "is_tracking": true
  }
}
```

**curl:**
```bash
curl -X POST http://localhost:3000/api/seo/keywords \
  -H "Content-Type: application/json" \
  -b "cookies.txt" \
  -d '{"website_id": "WEBSITE_UUID", "keyword": "web development"}'
```

---

#### GET /api/seo/recommendations

Get SEO recommendations for a website, ordered by priority.

**Authentication:** Required (Supabase session)

**Query Parameters:**
| Parameter | Required | Description |
|---|---|---|
| `website_id` | Yes | Website UUID |

**Response (200):**
```json
{
  "recommendations": [
    {
      "id": "uuid",
      "website_id": "uuid",
      "category": "keywords",
      "priority": "high",
      "title": "Target 'web development' keyword",
      "description": "This keyword has high potential...",
      "impact_score": 80,
      "effort_score": 60,
      "ai_generated": true
    }
  ]
}
```

**curl:**
```bash
curl "http://localhost:3000/api/seo/recommendations?website_id=WEBSITE_UUID" \
  -b "cookies.txt"
```

---

#### POST /api/seo/recommendations

Generate AI-powered keyword recommendations for a website using OpenAI.

**Authentication:** Required (Supabase session)

**Request:**
```json
{
  "website_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "count": 10,
  "recommendations": [
    {
      "website_id": "uuid",
      "category": "keywords",
      "priority": "high",
      "title": "Target 'keyword' keyword",
      "impact_score": 80,
      "effort_score": 60,
      "ai_generated": true
    }
  ]
}
```

**curl:**
```bash
curl -X POST http://localhost:3000/api/seo/recommendations \
  -H "Content-Type: application/json" \
  -b "cookies.txt" \
  -d '{"website_id": "WEBSITE_UUID"}'
```

---

### 7. PageSpeed

#### POST /api/pagespeed/analyze

Run a Google PageSpeed Insights audit on a URL. Analyzes performance, accessibility, best practices, and SEO scores.

**Authentication:** Required (Supabase session)

**Request:**
```json
{
  "url": "https://example.com",
  "websiteId": "uuid",
  "strategy": "mobile"
}
```

| Field | Required | Description |
|---|---|---|
| `url` | Yes | URL to analyze |
| `websiteId` | No | Website UUID (saves results to DB if provided) |
| `strategy` | No | `mobile` (default) or `desktop` |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "url": "https://example.com",
    "strategy": "mobile",
    "scores": {
      "performance": 85,
      "accessibility": 92,
      "bestPractices": 88,
      "seo": 95
    },
    "fieldMetrics": {
      "lcp": { "percentile": 2500, "category": "NEEDS_IMPROVEMENT" },
      "cls": { "percentile": 0.05, "category": "GOOD" },
      "overall_category": "AVERAGE"
    },
    "labMetrics": {
      "fcp": 1200,
      "lcp": 2500,
      "tbt": 150,
      "cls": 0.05,
      "si": 3200,
      "tti": 4500
    },
    "opportunities": [
      {
        "title": "Serve images in next-gen formats",
        "description": "Image formats like WebP...",
        "score": 0.5,
        "numericValue": 1500,
        "displayValue": "Potential savings of 1.5 s"
      }
    ],
    "diagnostics": [...]
  }
}
```

**Rate Limits:** Google PageSpeed Insights API free tier: 25,000 queries/day, 400 queries/100 seconds.

**curl:**
```bash
curl -X POST http://localhost:3000/api/pagespeed/analyze \
  -H "Content-Type: application/json" \
  -b "cookies.txt" \
  -d '{"url": "https://example.com", "websiteId": "WEBSITE_UUID", "strategy": "mobile"}'
```

---

#### GET /api/pagespeed/analyze

Fetch the latest PageSpeed audit for a website.

**Authentication:** Required (Supabase session)

**Query Parameters:**
| Parameter | Required | Description |
|---|---|---|
| `websiteId` | One of these | Website UUID |
| `url` | One of these | URL that was analyzed |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "website_id": "uuid",
    "url": "https://example.com",
    "performance_score": 85,
    "accessibility_score": 92,
    "best_practices_score": 88,
    "seo_score": 95,
    "field_metrics": {...},
    "lab_metrics": {...},
    "opportunities": [...],
    "created_at": "2025-01-15T12:00:00Z"
  }
}
```

**curl:**
```bash
curl "http://localhost:3000/api/pagespeed/analyze?websiteId=WEBSITE_UUID" \
  -b "cookies.txt"
```

---

### 8. Google Analytics

#### GET /api/google-analytics

Fetch Google Analytics 4 data for a property. Returns user metrics, device breakdown, and top countries.

**Authentication:** Required (Supabase session)

**Prerequisites:** Requires `GOOGLE_APPLICATION_CREDENTIALS_JSON` environment variable with a service account JSON key that has access to the GA4 property.

**Query Parameters:**
| Parameter | Required | Description |
|---|---|---|
| `propertyId` | Yes | GA4 property ID (numeric) |
| `startDate` | No | Start date (default: `7daysAgo`). Formats: `YYYY-MM-DD`, `NdaysAgo`, `today`, `yesterday` |
| `endDate` | No | End date (default: `today`) |

**Response (200):**
```json
{
  "success": true,
  "configured": true,
  "propertyId": "123456789",
  "dateRange": {
    "startDate": "7daysAgo",
    "endDate": "today"
  },
  "summary": {
    "totalUsers": 1500,
    "totalSessions": 2200,
    "totalPageViews": 5000,
    "avgBounceRate": 0.45,
    "avgSessionDuration": 120.5
  },
  "deviceBreakdown": {
    "desktop": 800,
    "mobile": 600,
    "tablet": 100
  },
  "topCountries": [
    { "country": "Turkey", "users": 500 },
    { "country": "United States", "users": 300 }
  ],
  "rawData": [...]
}
```

**curl:**
```bash
curl "http://localhost:3000/api/google-analytics?propertyId=123456789&startDate=30daysAgo" \
  -b "cookies.txt"
```

---

### 9. Chatbot

#### POST /api/chatbot/log

Log chatbot conversations. Supports starting, messaging, and ending conversations.

**Authentication:** None (public)

**Actions:**

**Start a conversation:**
```json
{
  "siteId": "website-uuid",
  "sessionId": "unique-session-id",
  "action": "start",
  "userInfo": {
    "ip": "1.2.3.4",
    "userAgent": "Mozilla/5.0...",
    "country": "TR"
  }
}
```

**Send a message:**
```json
{
  "siteId": "website-uuid",
  "sessionId": "session-id",
  "action": "message",
  "message": {
    "role": "user",
    "content": "Hello, I need help",
    "timestamp": "2025-01-15T12:00:00Z"
  }
}
```

**End a conversation:**
```json
{
  "siteId": "website-uuid",
  "sessionId": "session-id",
  "action": "end"
}
```

| Field | Required | Description |
|---|---|---|
| `siteId` | Yes | Website UUID |
| `sessionId` | Yes | Unique session identifier |
| `action` | Yes | `start`, `message`, or `end` |
| `message` | Yes (for `message` action) | Object with `role` (`user`/`assistant`), `content`, and optional `timestamp` |
| `userInfo` | No | User metadata for `start` action |

**Response (200):**
```json
{
  "success": true,
  "action": "message_added"
}
```

**curl:**
```bash
curl -X POST http://localhost:3000/api/chatbot/log \
  -H "Content-Type: application/json" \
  -d '{"siteId": "WEBSITE_UUID", "sessionId": "sess_123", "action": "message", "message": {"role": "user", "content": "Hello"}}'
```

---

#### GET /api/chatbot/log

Retrieve chatbot conversations for a website.

**Authentication:** Required (Supabase session)

**Query Parameters:**
| Parameter | Required | Description |
|---|---|---|
| `siteId` | Yes | Website UUID |
| `sessionId` | No | Filter by specific session |

**Response (200):**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "website_id": "uuid",
      "session_id": "sess_123",
      "messages": [
        { "role": "user", "content": "Hello", "timestamp": "..." },
        { "role": "assistant", "content": "Hi! How can I help?", "timestamp": "..." }
      ],
      "message_count": 2,
      "user_info": {},
      "started_at": "2025-01-15T12:00:00Z",
      "last_message_at": "2025-01-15T12:05:00Z"
    }
  ]
}
```

**curl:**
```bash
curl "http://localhost:3000/api/chatbot/log?siteId=WEBSITE_UUID" \
  -b "cookies.txt"
```

---

#### POST /api/chatbot/test

Test if a chatbot is working for a specific website. Checks website accessibility and log API functionality.

**Authentication:** Required (Supabase session)

**Request:**
```json
{
  "websiteId": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "test": {
    "websiteAccessible": true,
    "chatbotScriptFound": true,
    "logApiWorking": true,
    "overallStatus": "pass",
    "details": [
      "Website is accessible",
      "Chatbot log API is working",
      "2 conversations in the last hour"
    ]
  },
  "timestamp": "2025-01-15T12:00:00Z"
}
```

**curl:**
```bash
curl -X POST http://localhost:3000/api/chatbot/test \
  -H "Content-Type: application/json" \
  -b "cookies.txt" \
  -d '{"websiteId": "WEBSITE_UUID"}'
```

---

### 10. Vercel Deployments

#### GET /api/vercel/deployments

Fetch recent Vercel deployments for a website. Requires the website to have a `vercel_project_id` configured.

**Authentication:** Required (Supabase session)

**Prerequisites:** Requires `VERCEL_API_TOKEN` environment variable.

**Query Parameters:**
| Parameter | Required | Description |
|---|---|---|
| `websiteId` | Yes | Website UUID |

**Response (200):**
```json
{
  "deployments": [
    {
      "uid": "dpl_xxxx",
      "url": "my-app-xxxx.vercel.app",
      "state": "READY",
      "created": 1705312800000,
      "target": "production",
      "creator": {
        "username": "myuser"
      },
      "meta": {
        "githubCommitMessage": "fix: resolve bug",
        "githubCommitRef": "main",
        "githubCommitSha": "abc123"
      }
    }
  ]
}
```

**curl:**
```bash
curl "http://localhost:3000/api/vercel/deployments?websiteId=WEBSITE_UUID" \
  -b "cookies.txt"
```

---

### 11. Alerts

#### POST /api/alerts/test

Test alert notification channels (Telegram and/or email).

**Authentication:** Required (Supabase session)

**Request:**
```json
{
  "type": "telegram"
}
```

| Field | Required | Description |
|---|---|---|
| `type` | Yes | `telegram`, `email`, or `all` |

**Response (200) - Single channel:**
```json
{
  "success": true,
  "message": "Test message sent successfully"
}
```

**Response (200) - All channels:**
```json
{
  "telegram": { "success": true, "message": "..." },
  "email": { "success": true, "message": "..." },
  "overall": true
}
```

**curl:**
```bash
curl -X POST http://localhost:3000/api/alerts/test \
  -H "Content-Type: application/json" \
  -b "cookies.txt" \
  -d '{"type": "all"}'
```

---

### 12. Cron Jobs

These endpoints are protected by Bearer token authentication using the `CRON_SECRET` environment variable. They are configured in `vercel.json` to run on a schedule.

#### GET /api/cron/uptime-check

Performs uptime checks for all registered websites. Triggers downtime/recovery alerts when status changes are detected.

**Authentication:** Bearer token (`CRON_SECRET`)

**Schedule:** Daily at midnight UTC (`0 0 * * *`)

**Response (200):**
```json
{
  "success": true,
  "timestamp": "2025-01-15T00:00:00Z",
  "results": [
    {
      "website": "My Website",
      "domain": "example.com",
      "is_up": true,
      "status_code": 200,
      "response_time": 245,
      "error": null
    }
  ],
  "status_changes": [
    {
      "website": "Other Site",
      "domain": "other.com",
      "from": "online",
      "to": "offline"
    }
  ],
  "alerts": [
    { "type": "downtime", "website": "Other Site", "alertSent": true }
  ]
}
```

**curl:**
```bash
curl http://localhost:3000/api/cron/uptime-check \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

#### GET /api/cron/smart-health-check

Adaptive health monitoring that intelligently decides which sites need checking based on recent activity, error rates, and last check status. Reduces monitoring costs by skipping unnecessary checks.

**Authentication:** Bearer token (`CRON_SECRET`)

**Schedule:** Daily at noon UTC (`0 12 * * *`)

**Decision Logic:**
1. If site has recent user activity (last 1 hour) -> Skip (already alive)
2. If unresolved errors detected -> Check frequently
3. If last check showed downtime -> Check to verify recovery
4. If last check was OK and within 30 minutes -> Skip
5. Default: Perform check

**Response (200):**
```json
{
  "success": true,
  "timestamp": "2025-01-15T12:00:00Z",
  "strategy": "adaptive",
  "summary": {
    "total_websites": 4,
    "sites_checked": 1,
    "sites_skipped": 3,
    "cost_savings": "75% fewer checks",
    "reasons": {
      "active_users": 2,
      "recent_errors": 0,
      "last_check_ok": 1,
      "downtime_verification": 0,
      "default_check": 1
    }
  },
  "decisions": [...],
  "uptime_results": [...]
}
```

**curl:**
```bash
curl http://localhost:3000/api/cron/smart-health-check \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

#### GET /api/cron/pagespeed-check

Runs daily PageSpeed Insights audits for all registered websites (both mobile and desktop strategies).

**Authentication:** Bearer token (`CRON_SECRET`)

**Schedule:** Recommended daily at 6 AM UTC (`0 6 * * *`) - not currently in `vercel.json`

**Response (200):**
```json
{
  "success": true,
  "timestamp": "2025-01-15T06:00:00Z",
  "results": [
    {
      "website": "example.com",
      "strategy": "mobile",
      "success": true,
      "score": 85
    },
    {
      "website": "example.com",
      "strategy": "desktop",
      "success": true,
      "score": 92
    }
  ]
}
```

**curl:**
```bash
curl http://localhost:3000/api/cron/pagespeed-check \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## Tracking Script Integration

The platform provides client-side tracking scripts that should be installed on monitored websites.

### Simple Tracker (Recommended)

Add to your website's `<head>` tag:

```html
<script src="https://your-dashboard.vercel.app/track.js" data-site="yourdomain.com"></script>
```

This automatically tracks:
- Page views
- Time on page
- Scroll depth
- External link clicks
- Custom events via `window.webmasterAnalytics.track()`

### Advanced Tracker (with Error Tracking)

```html
<script>
  window.WEBMASTER_SITE_ID = 'your-website-id-here';
  window.WEBMASTER_API_URL = 'https://your-dashboard.vercel.app';
</script>
<script src="https://your-dashboard.vercel.app/tracking/webmaster-analytics.js" async></script>
```

This additionally tracks:
- JavaScript errors
- Unhandled promise rejections

### Web Vitals Tracker

```html
<script src="https://your-dashboard.vercel.app/tracking/webmaster-analytics-vitals.js" async></script>
```

Tracks Core Web Vitals: LCP, INP, CLS, TTFB, FCP.
