import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default async function DiagnosticPage() {
  const supabase = await createClient()

  // Check websites
  const { data: websites, count: websitesCount } = await supabase
    .from('websites')
    .select('*', { count: 'exact' })

  // Check analytics events (last 24 hours)
  const last24h = new Date()
  last24h.setHours(last24h.getHours() - 24)

  const { data: recentEvents, count: eventsCount } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact' })
    .gte('created_at', last24h.toISOString())
    .order('created_at', { ascending: false })
    .limit(10)

  // Check error logs (last 24 hours)
  const { data: recentErrors, count: errorsCount } = await supabase
    .from('error_logs')
    .select('*', { count: 'exact' })
    .gte('created_at', last24h.toISOString())
    .order('created_at', { ascending: false })
    .limit(10)

  // Check uptime checks
  const { count: uptimeCount } = await supabase
    .from('uptime_checks')
    .select('*', { count: 'exact', head: true })

  // Check chatbot conversations
  const { count: chatbotCount } = await supabase
    .from('chatbot_conversations')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Database Diagnostic</h1>
        <p className="text-muted-foreground mt-2">
          Check what data is being tracked in the database
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard title="Websites" count={websitesCount || 0} />
        <StatCard title="Events (24h)" count={eventsCount || 0} />
        <StatCard title="Errors (24h)" count={errorsCount || 0} />
        <StatCard title="Uptime Checks" count={uptimeCount || 0} />
        <StatCard title="Chatbot Conv." count={chatbotCount || 0} />
      </div>

      {/* Websites */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Websites</CardTitle>
          <CardDescription>All websites in the database</CardDescription>
        </CardHeader>
        <CardContent>
          {websites && websites.length > 0 ? (
            <div className="space-y-2">
              {websites.map((site) => (
                <div key={site.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{site.name}</p>
                    <p className="text-sm text-muted-foreground">{site.domain}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {site.id.slice(0, 8)}...
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No websites found</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Analytics Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Analytics Events (Last 24h)</CardTitle>
          <CardDescription>
            Total: {eventsCount || 0} events | Showing last 10
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentEvents && recentEvents.length > 0 ? (
            <div className="space-y-2">
              {recentEvents.map((event, idx) => (
                <div key={idx} className="text-sm p-3 border rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant="outline">{event.event_type}</Badge>
                      <span className="ml-2 text-muted-foreground font-mono text-xs">
                        {event.url}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">❌ No analytics events in the last 24 hours</p>
              <p className="text-sm text-muted-foreground mt-2">
                Make sure the tracking script is installed on your websites
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Errors */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Errors (Last 24h)</CardTitle>
          <CardDescription>
            Total: {errorsCount || 0} errors | Showing last 10
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentErrors && recentErrors.length > 0 ? (
            <div className="space-y-2">
              {recentErrors.map((error, idx) => (
                <div key={idx} className="text-sm p-3 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="destructive">{error.error_type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(error.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="font-medium">{error.error_message}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {error.page_url}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">❌ No errors logged in the last 24 hours</p>
              <p className="text-sm text-muted-foreground mt-2">
                This is good, but if you expect errors, check the tracking script
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tracking Script Status */}
      <Card>
        <CardHeader>
          <CardTitle>Tracking Status</CardTitle>
          <CardDescription>What to check next</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className={`mt-1 ${eventsCount && eventsCount > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {eventsCount && eventsCount > 0 ? '✅' : '❌'}
            </div>
            <div>
              <p className="font-medium">Analytics Tracking</p>
              <p className="text-sm text-muted-foreground">
                {eventsCount && eventsCount > 0
                  ? 'Working correctly - receiving events'
                  : 'Not receiving events - check if tracking script is installed'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className={`mt-1 ${errorsCount && errorsCount > 0 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
              {errorsCount && errorsCount > 0 ? '⚠️' : 'ℹ️'}
            </div>
            <div>
              <p className="font-medium">Error Tracking</p>
              <p className="text-sm text-muted-foreground">
                {errorsCount && errorsCount > 0
                  ? 'Errors are being logged'
                  : 'No errors in last 24h - trigger a test error to verify it works'}
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Next Steps:</p>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Visit <a href="/test-error-tracking" className="text-primary underline">/test-error-tracking</a> to test error tracking</li>
              <li>Check browser console for tracking script messages</li>
              <li>Verify tracking script is installed on all websites</li>
              <li>Test by visiting one of your tracked websites</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, count }: { title: string; count: number }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{count}</div>
      </CardContent>
    </Card>
  )
}
