import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  TrendingUp,
  TrendingDown,
  FileText,
  ExternalLink,
  Eye,
  MousePointer,
  Target,
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SEODashboardPage() {
  const supabase = await createClient()

  // Get all websites
  const { data: websites } = await supabase
    .from('websites')
    .select('*')
    .order('name')

  // Get SEO data for each website
  const seoData = await Promise.all(
    (websites || []).map(async (website) => {
      // Search Console data (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: queries } = await supabase
        .from('search_console_queries')
        .select('*')
        .eq('website_id', website.id)
        .gte('date', sevenDaysAgo.toISOString().split('T')[0])

      const { data: pages } = await supabase
        .from('search_console_pages')
        .select('*')
        .eq('website_id', website.id)
        .gte('date', sevenDaysAgo.toISOString().split('T')[0])

      // Aggregate Search Console stats
      const totalClicks = (queries || []).reduce((sum, q) => sum + (q.clicks || 0), 0)
      const totalImpressions = (queries || []).reduce((sum, q) => sum + (q.impressions || 0), 0)
      const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
      const avgPosition =
        (queries || []).reduce((sum, q) => sum + (q.position || 0), 0) / (queries?.length || 1)

      // Top queries
      const queryMap = new Map<string, any>()
      queries?.forEach(q => {
        const existing = queryMap.get(q.query)
        if (!existing || q.clicks > existing.clicks) {
          queryMap.set(q.query, q)
        }
      })
      const topQueries = Array.from(queryMap.values())
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5)

      // Keywords
      const { data: keywords } = await supabase
        .from('keywords')
        .select('*')
        .eq('website_id', website.id)
        .order('current_position', { ascending: true, nullsFirst: false })

      const rankedKeywords = keywords?.filter(k => k.current_position !== null) || []
      const top10Keywords = rankedKeywords.filter(k => k.current_position! <= 10).length
      const top20Keywords = rankedKeywords.filter(k => k.current_position! <= 20).length

      // Latest SEO audit
      const { data: latestAudit } = await supabase
        .from('seo_audits')
        .select('*')
        .eq('website_id', website.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      return {
        website,
        searchConsole: {
          clicks: totalClicks,
          impressions: totalImpressions,
          ctr: avgCTR,
          avgPosition,
          topQueries,
          totalQueries: queryMap.size,
        },
        keywords: {
          total: keywords?.length || 0,
          ranked: rankedKeywords.length,
          top10: top10Keywords,
          top20: top20Keywords,
          list: keywords || [],
        },
        audit: latestAudit,
      }
    })
  )

  // Calculate overall stats
  const totalClicks = seoData.reduce((sum, d) => sum + d.searchConsole.clicks, 0)
  const totalImpressions = seoData.reduce((sum, d) => sum + d.searchConsole.impressions, 0)
  const totalKeywords = seoData.reduce((sum, d) => sum + d.keywords.total, 0)
  const totalTop10 = seoData.reduce((sum, d) => sum + d.keywords.top10, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">SEO Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Search Console, keyword rankings, and SEO health
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/keywords">
            <Button variant="outline">Manage Keywords</Button>
          </Link>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Clicks (7d)"
          value={totalClicks.toLocaleString()}
          icon={<MousePointer className="h-4 w-4" />}
          description="From Google Search"
        />
        <StatsCard
          title="Total Impressions (7d)"
          value={totalImpressions.toLocaleString()}
          icon={<Eye className="h-4 w-4" />}
          description="Search appearances"
        />
        <StatsCard
          title="Keywords Tracked"
          value={totalKeywords.toString()}
          icon={<Search className="h-4 w-4" />}
          description="All websites"
        />
        <StatsCard
          title="Top 10 Rankings"
          value={totalTop10.toString()}
          icon={<Target className="h-4 w-4" />}
          description="First page results"
        />
      </div>

      {/* Website SEO Cards */}
      <div className="space-y-6">
        {seoData.map(({ website, searchConsole, keywords, audit }) => (
          <Card key={website.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{website.name}</CardTitle>
                  <CardDescription>{website.domain}</CardDescription>
                </div>
                <Link href={`/dashboard/sites/${website.domain}`}>
                  <Button variant="outline" size="sm">
                    View Details
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="search-console" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="search-console">Search Console</TabsTrigger>
                  <TabsTrigger value="keywords">Keywords</TabsTrigger>
                  <TabsTrigger value="audit">SEO Audit</TabsTrigger>
                </TabsList>

                {/* Search Console Tab */}
                <TabsContent value="search-console" className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <MetricBox
                      label="Clicks"
                      value={searchConsole.clicks.toLocaleString()}
                      color="text-blue-600"
                    />
                    <MetricBox
                      label="Impressions"
                      value={searchConsole.impressions.toLocaleString()}
                      color="text-purple-600"
                    />
                    <MetricBox
                      label="Avg CTR"
                      value={`${searchConsole.ctr.toFixed(2)}%`}
                      color="text-green-600"
                    />
                    <MetricBox
                      label="Avg Position"
                      value={searchConsole.avgPosition.toFixed(1)}
                      color="text-orange-600"
                    />
                  </div>

                  {searchConsole.topQueries.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-3">Top Queries (Last 7 Days)</h4>
                      <div className="space-y-2">
                        {searchConsole.topQueries.map((query, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2 border rounded text-sm"
                          >
                            <span className="font-mono">{query.query}</span>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span>{query.clicks} clicks</span>
                              <span>{query.impressions} impressions</span>
                              <span>Pos: {query.position.toFixed(1)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchConsole.topQueries.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No Search Console data yet. Make sure the site is verified in Google Search
                      Console.
                    </p>
                  )}
                </TabsContent>

                {/* Keywords Tab */}
                <TabsContent value="keywords" className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <MetricBox
                      label="Total Keywords"
                      value={keywords.total.toString()}
                      color="text-blue-600"
                    />
                    <MetricBox
                      label="Ranked in Top 100"
                      value={keywords.ranked.toString()}
                      color="text-purple-600"
                    />
                    <MetricBox
                      label="Top 10 (Page 1)"
                      value={keywords.top10.toString()}
                      color="text-green-600"
                    />
                    <MetricBox
                      label="Top 20 (Page 2)"
                      value={keywords.top20.toString()}
                      color="text-yellow-600"
                    />
                  </div>

                  {keywords.list.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-3">Top Keywords</h4>
                      <div className="space-y-2">
                        {keywords.list.slice(0, 5).map((keyword) => (
                          <div
                            key={keyword.id}
                            className="flex items-center justify-between p-2 border rounded text-sm"
                          >
                            <span className="font-medium">{keyword.keyword}</span>
                            <div className="flex gap-4 items-center">
                              {keyword.search_volume && (
                                <span className="text-xs text-muted-foreground">
                                  {keyword.search_volume.toLocaleString()}/mo
                                </span>
                              )}
                              {keyword.current_position ? (
                                <Badge
                                  variant={
                                    keyword.current_position <= 3
                                      ? 'default'
                                      : keyword.current_position <= 10
                                      ? 'secondary'
                                      : 'outline'
                                  }
                                >
                                  #{keyword.current_position}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">Not ranked</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {keywords.list.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <p className="mb-4">No keywords tracked yet</p>
                      <Link href="/dashboard/keywords">
                        <Button>Add Keywords</Button>
                      </Link>
                    </div>
                  )}
                </TabsContent>

                {/* SEO Audit Tab */}
                <TabsContent value="audit" className="space-y-4">
                  {audit ? (
                    <>
                      <div className="grid grid-cols-4 gap-4">
                        <MetricBox
                          label="SEO Score"
                          value={audit.score.toString()}
                          color={
                            audit.score >= 80
                              ? 'text-green-600'
                              : audit.score >= 60
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }
                        />
                        <MetricBox
                          label="Word Count"
                          value={audit.word_count?.toString() || '0'}
                          color="text-blue-600"
                        />
                        <MetricBox
                          label="Internal Links"
                          value={audit.internal_links_count?.toString() || '0'}
                          color="text-purple-600"
                        />
                        <MetricBox
                          label="Images"
                          value={audit.images_count?.toString() || '0'}
                          color="text-orange-600"
                        />
                      </div>

                      {audit.issues && audit.issues.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-3">Issues Found</h4>
                          <div className="space-y-2">
                            {audit.issues.slice(0, 5).map((issue: any, i: number) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 p-2 border rounded text-sm"
                              >
                                <Badge
                                  variant={
                                    issue.severity === 'high'
                                      ? 'destructive'
                                      : issue.severity === 'medium'
                                      ? 'secondary'
                                      : 'outline'
                                  }
                                >
                                  {issue.severity}
                                </Badge>
                                <span>{issue.message}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Last audit: {new Date(audit.created_at).toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No SEO audit performed yet
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>
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

function MetricBox({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div className="text-center p-3 border rounded">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  )
}
