import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Mail, Calendar } from 'lucide-react'
import Link from 'next/link'
import { ReportBuilder } from '@/components/reports/report-builder'
import { ScheduledReports } from '@/components/reports/scheduled-reports'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const supabase = await createClient()

  // Get all websites
  const { data: websites } = await supabase
    .from('websites')
    .select('*')
    .order('name')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-2">
            Generate custom reports and schedule automated deliveries
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Report</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">📊</div>
            <p className="text-xs text-muted-foreground mt-2">
              Automated weekly summary email
            </p>
            <Button variant="outline" size="sm" className="mt-3 w-full">
              Configure
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custom Report</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">📝</div>
            <p className="text-xs text-muted-foreground mt-2">
              Build your own custom report
            </p>
            <Button variant="outline" size="sm" className="mt-3 w-full">
              Create Report
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Export Data</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">💾</div>
            <p className="text-xs text-muted-foreground mt-2">
              Download CSV or PDF exports
            </p>
            <Button variant="outline" size="sm" className="mt-3 w-full">
              Export
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Report Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Report Builder</CardTitle>
          <CardDescription>
            Select metrics and date range to generate a custom report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportBuilder websites={websites || []} />
        </CardContent>
      </Card>

      {/* Scheduled Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Reports</CardTitle>
          <CardDescription>
            Manage automated report delivery schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduledReports />
        </CardContent>
      </Card>
    </div>
  )
}
