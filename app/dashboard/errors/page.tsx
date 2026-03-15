import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, XCircle, Clock, TrendingDown } from 'lucide-react'
import { ErrorsList } from '@/components/errors/errors-list'
import { ErrorChart } from '@/components/errors/error-chart'
import { ErrorTypeBreakdown } from '@/components/errors/error-type-breakdown'

export const dynamic = 'force-dynamic'

export default async function ErrorsPage() {
  const supabase = await createClient()

  // Fetch errors (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: errors } = await supabase
    .from('error_logs')
    .select('*')
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(100)

  const totalErrors = errors?.length || 0
  const unresolvedErrors = errors?.filter(e => !e.is_resolved).length || 0
  const criticalErrors = errors?.filter(e => e.error_type === 'critical').length || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Error Tracking</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and resolve errors across all websites
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Errors"
          value={totalErrors.toString()}
          icon={<AlertTriangle className="h-4 w-4" />}
          description="Last 7 days"
        />
        <StatsCard
          title="Unresolved"
          value={unresolvedErrors.toString()}
          icon={<XCircle className="h-4 w-4 text-red-500" />}
          description="Needs attention"
        />
        <StatsCard
          title="Critical"
          value={criticalErrors.toString()}
          icon={<AlertTriangle className="h-4 w-4 text-yellow-500" />}
          description="High priority"
        />
        <StatsCard
          title="Error Rate"
          value="0.5%"
          icon={<TrendingDown className="h-4 w-4 text-green-500" />}
          description="Decreasing"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Error Trend</CardTitle>
            <CardDescription>Daily error count over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Error Type Breakdown</CardTitle>
            <CardDescription>Distribution by error category</CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorTypeBreakdown />
          </CardContent>
        </Card>
      </div>

      {/* Errors List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Errors</CardTitle>
          <CardDescription>
            Latest errors from all websites (last 100)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorsList errors={errors || []} />
        </CardContent>
      </Card>
    </div>
  )
}

function StatsCard({
  title,
  value,
  icon,
  description,
}: {
  title: string
  value: string
  icon: React.ReactNode
  description: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}
