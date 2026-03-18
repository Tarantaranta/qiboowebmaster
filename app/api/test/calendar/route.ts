import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { websiteId, domain } = await req.json()

    // Test calendar integration endpoint
    const calendarUrl = `https://${domain}/api/calendar/availability`

    try {
      const response = await fetch(calendarUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      const isWorking = response.ok
      const data = response.ok ? await response.json() : await response.text()

      return NextResponse.json({
        success: isWorking,
        status: response.status,
        message: isWorking ? 'Calendar integration is working' : 'Calendar returned error',
        details: {
          domain,
          endpoint: calendarUrl,
          hasData: !!data,
          dataPreview: JSON.stringify(data).slice(0, 200),
        }
      })
    } catch (fetchError: any) {
      return NextResponse.json({
        success: false,
        message: 'Calendar integration is not responding',
        error: fetchError.message,
        details: {
          domain,
          endpoint: calendarUrl,
        }
      })
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
