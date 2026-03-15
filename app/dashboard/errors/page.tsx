import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, XCircle, Clock, TrendingDown } from 'lucide-react'
import { ErrorsList } from '@/components/errors/errors-list'
import { ErrorChart } from '@/components/errors/error-chart'
import { ErrorTypeBreakdown } from '@/components/errors/error-type-breakdown'

export const dynamic = 'force-dynamic'

// Helper function to calculate daily error stats
function calculateDailyErrors(errors: any[]) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dailyData: Record<string, number> = {}

  errors.forEach(error => {
    const date = new Date(error.created_at)
    const dayName = days[date.getDay()]
    dailyData[dayName] = (dailyData[dayName] || 0) + 1
  })

  // Get the last 7 days in order
  const today = new Date()
  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dayName = days[date.getDay()]
    last7Days.push({
      date: dayName,
      errors: dailyData[dayName] || 0
    })
  }

  return last7Days
}

// Helper function to calculate error type breakdown
function calculateErrorTypeBreakdown(errors: any[]) {
  const typeCount: Record<string, number> = {}

  errors.forEach(error => {
    const type = error.error_type || 'Unknown'
    typeCount[type] = (typeCount[type] || 0) + 1
  })

  const total = errors.length
  const breakdown = Object.entries(typeCount)
    .map(([type, count]) => ({
      type,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count)

  return breakdown
}

export default async function ErrorsPage() {
  const supabase = await createClient()

  // Fetch errors (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: errors } = await supabase
    .from('error_logs')
    .select(`
      *,
      websites (
        name,
        domain
      )
    `)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(100)

  const totalErrors = errors?.length || 0
  const unresolvedErrors = errors?.filter(e => !e.is_resolved).length || 0
  const criticalErrors = errors?.filter(e => e.error_type === 'critical').length || 0

  // Calculate chart data
  const dailyErrorData = errors ? calculateDailyErrors(errors) : []
  const errorTypeData = errors ? calculateErrorTypeBreakdown(errors) : []

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
            <ErrorChart data={dailyErrorData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Error Type Breakdown</CardTitle>
            <CardDescription>Distribution by error category</CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorTypeBreakdown errorTypes={errorTypeData} />
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
