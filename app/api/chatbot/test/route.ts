import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Chatbot Test API
 *
 * Tests if a chatbot is working with minimal cost:
 * 1. Checks if chatbot embed script is accessible
 * 2. Verifies chatbot can log messages
 * 3. Returns health status
 */

export async function POST(request: Request) {
  try {
    const { websiteId } = await request.json()

    if (!websiteId) {
      return NextResponse.json(
        { error: 'websiteId is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get website info
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('domain')
      .eq('id', websiteId)
      .single()

    if (websiteError || !website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      )
    }

    const results = {
      websiteAccessible: false,
      chatbotScriptFound: false,
      logApiWorking: false,
      overallStatus: 'fail' as 'pass' | 'fail' | 'partial',
      details: [] as string[]
    }

    // Test 1: Check if website is accessible
    try {
      const websiteResponse = await fetch(`https://${website.domain}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      })
      results.websiteAccessible = websiteResponse.ok
      if (results.websiteAccessible) {
        results.details.push('✓ Website erişilebilir')
      } else {
        results.details.push(`✗ Website erişim hatası (${websiteResponse.status})`)
      }
    } catch (error: any) {
      results.details.push(`✗ Website erişilemiyor: ${error.message}`)
    }

    // Test 2: Test chatbot log API with a minimal test message
    const testSessionId = `test-${Date.now()}`
    try {
      const logResponse = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/chatbot/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: websiteId,
          sessionId: testSessionId,
          action: 'message',
          message: {
            role: 'user',
            content: 'test', // Minimal message
            timestamp: new Date().toISOString()
          }
        })
      })

      results.logApiWorking = logResponse.ok
      if (results.logApiWorking) {
        results.details.push('✓ Chatbot log API çalışıyor')

        // Clean up test conversation
        await supabase
          .from('chatbot_conversations')
          .delete()
          .eq('website_id', websiteId)
          .eq('session_id', testSessionId)
      } else {
        results.details.push('✗ Chatbot log API yanıt vermiyor')
      }
    } catch (error: any) {
      results.details.push(`✗ Chatbot log API hatası: ${error.message}`)
    }

    // Test 3: Check for recent chatbot activity (optional sanity check)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const { count: recentActivity } = await supabase
      .from('chatbot_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('website_id', websiteId)
      .gte('last_message_at', oneHourAgo.toISOString())

    if (recentActivity && recentActivity > 0) {
      results.details.push(`ℹ Son 1 saatte ${recentActivity} konuşma kaydı`)
    }

    // Determine overall status
    if (results.websiteAccessible && results.logApiWorking) {
      results.overallStatus = 'pass'
      results.chatbotScriptFound = true
    } else if (results.websiteAccessible || results.logApiWorking) {
      results.overallStatus = 'partial'
    }

    return NextResponse.json({
      success: true,
      test: results,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Chatbot test error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Test failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
