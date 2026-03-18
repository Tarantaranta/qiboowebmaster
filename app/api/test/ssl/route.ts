import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { websiteId, domain } = await req.json()

    // Test SSL certificate
    try {
      const response = await fetch(`https://${domain}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
      })

      // Check if HTTPS works
      const isSecure = response.url.startsWith('https://')

      // Try to get SSL certificate info via a separate API or library
      // For now, we'll just verify HTTPS works
      return NextResponse.json({
        success: isSecure,
        status: response.status,
        message: isSecure ? 'SSL certificate is valid and HTTPS is working' : 'HTTPS is not working properly',
        details: {
          domain,
          protocol: new URL(response.url).protocol,
          redirected: response.redirected,
          finalUrl: response.url,
        }
      })
    } catch (fetchError: any) {
      // Check if error is SSL-related
      const isSSLError = fetchError.message.includes('certificate') ||
                        fetchError.message.includes('SSL') ||
                        fetchError.message.includes('TLS')

      return NextResponse.json({
        success: false,
        message: isSSLError ? 'SSL certificate error' : 'Connection failed',
        error: fetchError.message,
        isSSLRelated: isSSLError,
        details: {
          domain,
          errorType: fetchError.name,
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
