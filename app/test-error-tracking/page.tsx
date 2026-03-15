'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestErrorTracking() {
  const [status, setStatus] = useState<string>('')

  const testErrorEndpoint = async () => {
    setStatus('Testing error endpoint...')

    try {
      const response = await fetch('/api/track/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: 'drkeremal.com', // Test with domain
          url: window.location.href,
          userAgent: navigator.userAgent,
          errorMessage: 'Test error from test page',
          errorType: 'TestError',
          stack: 'Test stack trace',
          timestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        const data = await response.json()
        setStatus('✅ Error tracked successfully! Check the errors page.')
      } else {
        const error = await response.text()
        setStatus(`❌ Error: ${response.status} - ${error}`)
      }
    } catch (err) {
      setStatus(`❌ Failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const triggerRealError = () => {
    setStatus('Triggering real JavaScript error...')
    // This will trigger window.addEventListener('error')
    setTimeout(() => {
      throw new Error('Test JavaScript error - should be caught by tracking script')
    }, 100)
  }

  const triggerUnhandledRejection = () => {
    setStatus('Triggering unhandled promise rejection...')
    // This will trigger window.addEventListener('unhandledrejection')
    Promise.reject(new Error('Test unhandled promise rejection'))
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Error Tracking Test Page</CardTitle>
          <CardDescription>
            Test the error tracking functionality to verify it's working correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button onClick={testErrorEndpoint} className="w-full">
              Test Error API Endpoint
            </Button>
            <p className="text-xs text-muted-foreground">
              Sends a test error directly to /api/track/error
            </p>
          </div>

          <div className="space-y-2">
            <Button onClick={triggerRealError} variant="destructive" className="w-full">
              Trigger JavaScript Error
            </Button>
            <p className="text-xs text-muted-foreground">
              Throws a real error that should be caught by the tracking script
            </p>
          </div>

          <div className="space-y-2">
            <Button onClick={triggerUnhandledRejection} variant="destructive" className="w-full">
              Trigger Unhandled Rejection
            </Button>
            <p className="text-xs text-muted-foreground">
              Creates an unhandled promise rejection
            </p>
          </div>

          {status && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-mono">{status}</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold mb-2">Instructions:</h3>
            <ol className="text-sm space-y-2 list-decimal list-inside">
              <li>Click "Test Error API Endpoint" to verify the endpoint works</li>
              <li>Check the Errors page to see if the test error appears</li>
              <li>Try triggering real JavaScript errors</li>
              <li>Verify errors appear in the dashboard within a few seconds</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
