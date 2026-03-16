import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'

export const dynamic = 'force-dynamic'

/**
 * Google Analytics 4 Data API Integration
 * 
 * This endpoint fetches analytics data from GA4 for a specific property.
 * Returns metrics like pageviews, sessions, bounce rate, session duration, etc.
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const startDate = searchParams.get('startDate') || '7daysAgo'
    const endDate = searchParams.get('endDate') || 'today'

    if (!propertyId) {
      return NextResponse.json(
        { error: 'propertyId parameter is required' },
        { status: 400 }
      )
    }

    // Check if Google credentials are configured
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON

    if (!credentialsJson || credentialsJson.trim() === '') {
      return NextResponse.json({
        error: 'Google Analytics not configured',
        message: 'GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set',
        configured: false
      })
    }

    // Parse credentials
    let credentials
    try {
      credentials = JSON.parse(credentialsJson)
    } catch (e) {
      return NextResponse.json({
        error: 'Invalid Google credentials',
        message: 'Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON',
        configured: false
      })
    }

    // Initialize GA Data API client
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: credentials
    })

    // Run report
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate,
          endDate,
        },
      ],
      dimensions: [
        { name: 'date' },
        { name: 'deviceCategory' },
        { name: 'country' },
      ],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
      ],
    })

    // Process response
    const rows = response.rows || []
    const data = rows.map(row => ({
      date: row.dimensionValues?.[0]?.value,
      device: row.dimensionValues?.[1]?.value,
      country: row.dimensionValues?.[2]?.value,
      activeUsers: parseInt(row.metricValues?.[0]?.value || '0'),
      sessions: parseInt(row.metricValues?.[1]?.value || '0'),
      pageViews: parseInt(row.metricValues?.[2]?.value || '0'),
      bounceRate: parseFloat(row.metricValues?.[3]?.value || '0'),
      avgSessionDuration: parseFloat(row.metricValues?.[4]?.value || '0'),
    }))

    // Calculate summary stats
    const summary = {
      totalUsers: data.reduce((sum, d) => sum + d.activeUsers, 0),
      totalSessions: data.reduce((sum, d) => sum + d.sessions, 0),
      totalPageViews: data.reduce((sum, d) => sum + d.pageViews, 0),
      avgBounceRate: data.length > 0 
        ? data.reduce((sum, d) => sum + d.bounceRate, 0) / data.length 
        : 0,
      avgSessionDuration: data.length > 0
        ? data.reduce((sum, d) => sum + d.avgSessionDuration, 0) / data.length
        : 0,
    }

    // Device breakdown
    const deviceBreakdown = data.reduce((acc: any, d) => {
      if (!acc[d.device]) acc[d.device] = 0
      acc[d.device] += d.activeUsers
      return acc
    }, {})

    // Country breakdown (top 10)
    const countryData = data.reduce((acc: any, d) => {
      if (!acc[d.country]) acc[d.country] = 0
      acc[d.country] += d.activeUsers
      return acc
    }, {})

    const topCountries = Object.entries(countryData)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 10)
      .map(([country, users]) => ({ country, users }))

    return NextResponse.json({
      success: true,
      configured: true,
      propertyId,
      dateRange: { startDate, endDate },
      summary,
      deviceBreakdown,
      topCountries,
      rawData: data,
    })

  } catch (error: any) {
    console.error('Google Analytics API Error:', error)
    
    return NextResponse.json({
      error: 'Failed to fetch Google Analytics data',
      message: error.message,
      details: error.toString(),
    }, { status: 500 })
  }
}
