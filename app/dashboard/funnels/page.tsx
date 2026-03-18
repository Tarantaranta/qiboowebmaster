import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowDown, GitBranch, LogIn, LogOut, Route } from 'lucide-react'
import { analyzeUserFlows, analyzeFunnel } from '@/lib/analytics/funnels'
import { FunnelChart } from '@/components/analytics/funnel-chart'
import { UserFlowTable } from '@/components/analytics/user-flow-table'

export const dynamic = 'force-dynamic'

// Default funnel templates for common website patterns
const DEFAULT_FUNNELS = [
  {
    name: 'Homepage to Contact',
    steps: [
      { name: 'Homepage', urlPattern: '/' },
      { name: 'About / Services', urlPattern: '/about*' },
      { name: 'Contact', urlPattern: '/contact*' },
    ],
  },
  {
    name: 'Landing to Conversion',
    steps: [
      { name: 'Landing Page', urlPattern: '/' },
      { name: 'Product / Service', urlPattern: '/hizmet*' },
      { name: 'Appointment / Contact', urlPattern: '/randevu*' },
    ],
  },
]

export default async function FunnelsPage() {
  const supabase = await createClient()

  // Get all websites
  const { data: websites } = await supabase
    .from('websites')
    .select('id, name, domain')
    .order('name')

  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  // Analyze user flows for each website
  const flowResults = await Promise.all(
    (websites || []).map(async (website) => {
      const flows = await analyzeUserFlows(website.id, startDate, endDate)
      return { website, flows }
    })
  )

  // Analyze default funnels for each website
  const funnelResults = await Promise.all(
    (websites || []).map(async (website) => {
      const funnels = await Promise.all(
        DEFAULT_FUNNELS.map(async (funnel) => {
          const result = await analyzeFunnel(website.id, funnel.steps, startDate, endDate)
          return { name: funnel.name, result }
        })
      )
      return { website, funnels }
    })
  )

  // Aggregate stats
  const totalSessions = flowResults.reduce((sum, r) => sum + r.flows.totalSessions, 0)
  const allEntryPages = aggregatePageCounts(flowResults.flatMap(r => r.flows.topEntryPages))
  const allExitPages = aggregatePageCounts(flowResults.flatMap(r => r.flows.topExitPages))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">User Flows & Funnels</h1>
        <p className="text-muted-foreground mt-2">
          Track user navigation paths and conversion funnels (last 30 days)
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Sessions"
          value={totalSessions.toString()}
          icon={<Route className="h-4 w-4" />}
          description="Last 30 days"
        />
        <StatsCard
          title="Top Entry Page"
          value={allEntryPages[0]?.page || '-'}
          icon={<LogIn className="h-4 w-4" />}
          description={`${allEntryPages[0]?.count || 0} sessions`}
        />
        <StatsCard
          title="Top Exit Page"
          value={allExitPages[0]?.page || '-'}
          icon={<LogOut className="h-4 w-4" />}
          description={`${allExitPages[0]?.count || 0} sessions`}
        />
        <StatsCard
          title="Websites Tracked"
          value={(websites?.length || 0).toString()}
          icon={<GitBranch className="h-4 w-4" />}
          description="Active websites"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="flows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="flows">User Flows</TabsTrigger>
          <TabsTrigger value="funnels">Conversion Funnels</TabsTrigger>
          <TabsTrigger value="entry-exit">Entry & Exit Pages</TabsTrigger>
        </TabsList>

        {/* User Flows Tab */}
        <TabsContent value="flows" className="space-y-6">
          {flowResults.map(({ website, flows }) => (
            <Card key={website.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{website.name}</CardTitle>
                    <CardDescription>{website.domain} - {flows.totalSessions} sessions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {flows.topPaths.length > 0 ? (
                  <UserFlowTable paths={flows.topPaths} />
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No navigation data available. Deploy the tracking script to start collecting data.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Conversion Funnels Tab */}
        <TabsContent value="funnels" className="space-y-6">
          {funnelResults.map(({ website, funnels }) => (
            <Card key={website.id}>
              <CardHeader>
                <CardTitle>{website.name}</CardTitle>
                <CardDescription>{website.domain}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {funnels.map((funnel) => (
                  <div key={funnel.name} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{funnel.name}</h3>
                      <Badge variant={funnel.result.overallConversionRate > 20 ? 'default' : 'secondary'}>
                        {funnel.result.overallConversionRate}% conversion
                      </Badge>
                    </div>

                    {funnel.result.totalEntries > 0 ? (
                      <>
                        <FunnelChart data={funnel.result.steps} />

                        {/* Step details */}
                        <div className="space-y-2">
                          {funnel.result.steps.map((step, i) => (
                            <div key={i} className="flex items-center gap-4">
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">{step.name}</span>
                                  <span className="text-sm">{step.visitors} visitors</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2 mt-1">
                                  <div
                                    className="bg-primary h-2 rounded-full transition-all"
                                    style={{ width: `${step.conversionRate}%` }}
                                  />
                                </div>
                              </div>
                              {i < funnel.result.steps.length - 1 && step.dropoff > 0 && (
                                <div className="flex items-center gap-1 text-xs text-red-500 w-24 justify-end">
                                  <ArrowDown className="h-3 w-3" />
                                  -{step.dropoff} ({step.dropoffRate}%)
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        No data for this funnel yet
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Entry & Exit Pages Tab */}
        <TabsContent value="entry-exit" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Entry Pages</CardTitle>
                <CardDescription>Where visitors start their sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allEntryPages.slice(0, 10).map((entry, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm font-mono truncate max-w-[250px]" title={entry.page}>
                        {entry.page}
                      </span>
                      <Badge variant="secondary">{entry.count}</Badge>
                    </div>
                  ))}
                  {allEntryPages.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No entry data</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Exit Pages</CardTitle>
                <CardDescription>Where visitors leave the site</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allExitPages.slice(0, 10).map((exit, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm font-mono truncate max-w-[250px]" title={exit.page}>
                        {exit.page}
                      </span>
                      <Badge variant="secondary">{exit.count}</Badge>
                    </div>
                  ))}
                  {allExitPages.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No exit data</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
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
        <div className="text-2xl font-bold truncate">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

function aggregatePageCounts(pages: { page: string; count: number }[]): { page: string; count: number }[] {
  const counts: Record<string, number> = {}
  for (const p of pages) {
    counts[p.page] = (counts[p.page] || 0) + p.count
  }
  return Object.entries(counts)
    .map(([page, count]) => ({ page, count }))
    .sort((a, b) => b.count - a.count)
}
