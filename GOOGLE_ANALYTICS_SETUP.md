# Google Analytics 4 Integration Setup

## Overview
Your webmaster dashboard now supports Google Analytics 4 (GA4) integration for advanced metrics like bounce rate, session duration, popular pages, and geographic distribution.

## Prerequisites
- Google Analytics 4 property set up for your websites
- Google Cloud Project with Analytics Data API enabled
- Service Account with Analytics Viewer permissions

## Setup Steps

### 1. Create Google Cloud Project
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing one
3. Enable **Google Analytics Data API**:
   - Search for "Google Analytics Data API" in the API Library
   - Click "Enable"

### 2. Create Service Account
1. Go to IAM & Admin → Service Accounts
2. Click "Create Service Account"
3. Name it (e.g., "webmaster-analytics-reader")
4. Grant role: **Viewer**
5. Click "Create Key" → Choose JSON
6. Download the JSON key file

### 3. Grant Service Account Access to GA4
1. Go to Google Analytics (https://analytics.google.com/)
2. Select your GA4 property
3. Go to Admin → Property Settings → Property Access Management
4. Click "Add users"
5. Add your service account email (from step 2)
6. Grant **Viewer** role
7. Save

### 4. Configure Environment Variables

#### Get GA4 Property ID
1. In Google Analytics, go to Admin → Property Settings
2. Copy your **Property ID** (format: `123456789`)

#### Add to Vercel Environment Variables

**Option A: Vercel Dashboard**
1. Go to your Vercel project settings
2. Environment Variables
3. Add:
   - `GOOGLE_APPLICATION_CREDENTIALS_JSON` = (paste entire JSON key content)
   - `NEXT_PUBLIC_GA4_PROPERTY_ID` = (your property ID, e.g., `123456789`)

**Option B: Command Line**
```bash
# Navigate to your project directory
cd /Users/keremal/webmaster_app

# Add credentials (paste JSON content when prompted)
vercel env add GOOGLE_APPLICATION_CREDENTIALS_JSON production

# Add property ID
vercel env add NEXT_PUBLIC_GA4_PROPERTY_ID production
```

### 5. Test the Integration

Once deployed, test the API:

```bash
curl "https://webmasterapp.vercel.app/api/google-analytics?propertyId=YOUR_PROPERTY_ID&startDate=7daysAgo&endDate=today"
```

Expected response:
```json
{
  "success": true,
  "configured": true,
  "summary": {
    "totalUsers": 1234,
    "totalSessions": 2345,
    "totalPageViews": 3456,
    "avgBounceRate": 0.45,
    "avgSessionDuration": 120.5
  },
  "deviceBreakdown": {
    "desktop": 800,
    "mobile": 400,
    "tablet": 34
  },
  "topCountries": [
    { "country": "United States", "users": 500 },
    { "country": "Turkey", "users": 300 }
  ]
}
```

## Usage in Dashboard

The GA data will automatically appear in:
- `/dashboard/sites/[domain]` - Site-specific analytics
- `/dashboard/analytics` - Global analytics overview

### Metrics Available:
- **Active Users** - Unique users in date range
- **Sessions** - Total sessions
- **Page Views** - Total pageviews
- **Bounce Rate** - % of single-page sessions
- **Avg Session Duration** - Average time spent
- **Device Breakdown** - Desktop/Mobile/Tablet split
- **Geographic Distribution** - Top countries

## Troubleshooting

### "Google Analytics not configured" error
- Ensure `GOOGLE_APPLICATION_CREDENTIALS_JSON` is set in Vercel
- Verify the JSON is valid (use a JSON validator)

### "Permission denied" error
- Check that service account has Viewer access to your GA4 property
- Verify the property ID is correct

### No data returned
- Ensure your GA4 property is collecting data
- Check date range (default is last 7 days)
- Verify tracking code is installed on your websites

## Security Notes
- Never commit JSON key files to Git
- Use environment variables for all credentials
- Rotate service account keys periodically
- Grant minimum required permissions (Viewer only)

## Next Steps
1. Configure credentials in Vercel
2. Redeploy your application
3. Test the API endpoint
4. View GA data in your dashboards!
