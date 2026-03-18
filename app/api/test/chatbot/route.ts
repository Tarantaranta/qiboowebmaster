import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { websiteId, domain } = await req.json()

    // Test chatbot endpoint
    const chatbotUrl = `https://${domain}/api/chatbot/test`

    try {
      const response = await fetch(chatbotUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 'Health check test' }),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      const isWorking = response.ok
      const responseData = await response.text()

      return NextResponse.json({
        success: isWorking,
        status: response.status,
        message: isWorking ? 'Chatbot is working' : 'Chatbot returned error',
        details: {
          domain,
          endpoint: chatbotUrl,
          responsePreview: responseData.slice(0, 200),
        }
      })
    } catch (fetchError: any) {
      return NextResponse.json({
        success: false,
        message: 'Chatbot is not responding',
        error: fetchError.message,
        details: {
          domain,
          endpoint: chatbotUrl,
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
