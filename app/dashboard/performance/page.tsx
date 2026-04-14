import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, Zap, Activity, Clock, Gauge, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { WebsiteSelector } from '@/components/website-selector'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ website?: string }>
}) {
  const supabase = createServiceRoleClient()
  const params = await searchParams
  const selectedWebsiteId = params.website || 'all'

  // Get all websites
  const { data: websites } = await supabase
    .from('websites')
    .select('*')
    .order('name')

  // Filter websites if specific one is selected
  const websitesToShow = selectedWebsiteId !== 'all'
    ? websites?.filter(w => w.id === selectedWebsiteId) || []
    : websites || []

  // Get latest PageSpeed audits for each website
  const performanceData = await Promise.all(
    websitesToShow.map(async (website) => {
      // Latest mobile audit
      const { data: mobileAudit } = await supabase
        .from('pagespeed_audits')
        .select('*')
        .eq('website_id', website.id)
        .eq('strategy', 'mobile')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Latest desktop audit
      const { data: desktopAudit } = await supabase
        .from('pagespeed_audits')
        .select('*')
        .eq('website_id', website.id)
        .eq('strategy', 'desktop')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Get Core Web Vitals (last 7 days averages)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const vitalsMetrics = ['LCP', 'INP', 'CLS', 'TTFB', 'FCP']
      const vitals: Record<string, any> = {}

      for (const metric of vitalsMetrics) {
        const { data } = await supabase
          .from('performance_metrics')
          .select('metric_value, rating')
          .eq('website_id', website.id)
          .eq('metric_name', metric)
          .gte('created_at', sevenDaysAgo.toISOString())

        if (data && data.length > 0) {
          const avgValue = data.reduce((sum, m) => sum + Number(m.metric_value), 0) / data.length
          const goodCount = data.filter(m => m.rating === 'good').length
          const rating = goodCount / data.length > 0.75 ? 'good' : goodCount / data.length > 0.5 ? 'needs-improvement' : 'poor'

          vitals[metric] = {
            value: Math.round(avgValue),
            rating,
            count: data.length
          }
        }
      }

      return {
        ...website,
        mobileAudit,
        desktopAudit,
        vitals
      }
    })
  )

  // Calculate overall stats
  const totalAudits = performanceData.filter(p => p.mobileAudit || p.desktopAudit).length
  const avgMobileScore = performanceData
    .filter(p => p.mobileAudit)
    .reduce((sum, p) => sum + (p.mobileAudit?.performance_score || 0), 0) / totalAudits || 0

  const avgDesktopScore = performanceData
    .filter(p => p.desktopAudit)
    .reduce((sum, p) => sum + (p.desktopAudit?.performance_score || 0), 0) / totalAudits || 0

  const selectedWebsite = websites?.find(w => w.id === selectedWebsiteId)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Performance</h1>
          <p className="text-muted-foreground mt-2">
            {selectedWebsite
              ? `Core Web Vitals and PageSpeed Insights for ${selectedWebsite.domain}`
              : 'Core Web Vitals and PageSpeed Insights for all websites'}
          </p>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <WebsiteSelector websites={websites || []} />
        </Suspense>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Average Mobile Score"
          value={Math.round(avgMobileScore)}
          icon={<Activity className="h-4 w-4" />}
          suffix="/100"
          color={getScoreColor(avgMobileScore)}
        />
        <StatsCard
          title="Average Desktop Score"
          value={Math.round(avgDesktopScore)}
          icon={<Gauge className="h-4 w-4" />}
          suffix="/100"
          color={getScoreColor(avgDesktopScore)}
        />
        <StatsCard
          title="Websites Tracked"
          value={websites?.length || 0}
          icon={<Zap className="h-4 w-4" />}
        />
        <StatsCard
          title="Total Audits"
          value={totalAudits * 2}
          icon={<Clock className="h-4 w-4" />}
          description="Mobile + Desktop"
        />
      </div>

      {/* Performance Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Websites Performance</h2>

        <div className="grid gap-6 md:grid-cols-1">
          {performanceData.map((site) => (
            <PerformanceCard key={site.id} site={site} />
          ))}
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>About Core Web Vitals</CardTitle>
          <CardDescription>What these metrics mean for your website</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">🚀 LCP (Largest Contentful Paint)</h3>
            <p className="text-sm text-muted-foreground">
              Measures loading performance. Good: &lt;2.5s | Needs Improvement: 2.5-4s | Poor: &gt;4s
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">⚡ INP (Interaction to Next Paint)</h3>
            <p className="text-sm text-muted-foreground">
              Measures interactivity. Good: &lt;200ms | Needs Improvement: 200-500ms | Poor: &gt;500ms
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">📐 CLS (Cumulative Layout Shift)</h3>
            <p className="text-sm text-muted-foreground">
              Measures visual stability. Good: &lt;0.1 | Needs Improvement: 0.1-0.25 | Poor: &gt;0.25
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">⏱️ TTFB (Time to First Byte)</h3>
            <p className="text-sm text-muted-foreground">
              Server response time. Good: &lt;800ms | Needs Improvement: 800-1800ms | Poor: &gt;1800ms
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">🎨 FCP (First Contentful Paint)</h3>
            <p className="text-sm text-muted-foreground">
              First paint time. Good: &lt;1.8s | Needs Improvement: 1.8-3s | Poor: &gt;3s
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatsCard({
  title,
  value,
  icon,
  suffix,
  description,
  color
}: {
  title: string
  value: number
  icon: React.ReactNode
  suffix?: string
  description?: string
  color?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color || ''}`}>
          {value}{suffix || ''}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

function PerformanceCard({ site }: { site: any }) {
  const mobileScore = site.mobileAudit?.performance_score || 0
  const desktopScore = site.desktopAudit?.performance_score || 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{site.name}</CardTitle>
            <CardDescription>{site.domain}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* PageSpeed Scores */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Mobile</span>
              <Badge variant={getScoreVariant(mobileScore)}>
                {mobileScore}/100
              </Badge>
            </div>
            {site.mobileAudit && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Accessibility: {site.mobileAudit.accessibility_score}</div>
                <div>SEO: {site.mobileAudit.seo_score}</div>
                <div>Best Practices: {site.mobileAudit.best_practices_score}</div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Desktop</span>
              <Badge variant={getScoreVariant(desktopScore)}>
                {desktopScore}/100
              </Badge>
            </div>
            {site.desktopAudit && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Accessibility: {site.desktopAudit.accessibility_score}</div>
                <div>SEO: {site.desktopAudit.seo_score}</div>
                <div>Best Practices: {site.desktopAudit.best_practices_score}</div>
              </div>
            )}
          </div>
        </div>

        {/* Core Web Vitals */}
        {Object.keys(site.vitals).length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Core Web Vitals (7 days avg)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {['LCP', 'INP', 'CLS', 'TTFB', 'FCP'].map((metric) => {
                const vital = site.vitals[metric]
                if (!vital) return null

                return (
                  <div key={metric} className="text-center p-2 border rounded">
                    <div className="text-xs text-muted-foreground">{metric}</div>
                    <div className={`text-sm font-bold ${getRatingColor(vital.rating)}`}>
                      {formatVitalValue(metric, vital.value)}
                    </div>
                    <div className="text-xs">{vital.count} samples</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Performance Opportunities */}
        {site.mobileAudit?.opportunities && site.mobileAudit.opportunities.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Improvement Opportunities (Mobile)
            </h4>
            <div className="space-y-2">
              {site.mobileAudit.opportunities.slice(0, 5).map((opp: any, idx: number) => (
                <div key={idx} className="flex items-start gap-2 text-sm p-2 bg-muted/50 rounded">
                  <div className="flex-1">
                    <div className="font-medium">{opp.title}</div>
                    {opp.displayValue && (
                      <div className="text-xs text-muted-foreground mt-1">{opp.displayValue}</div>
                    )}
                  </div>
                  {opp.numericValue && (
                    <Badge variant="secondary" className="text-xs">
                      {(opp.numericValue / 1000).toFixed(1)}s
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Diagnostics */}
        {site.mobileAudit?.diagnostics && site.mobileAudit.diagnostics.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Diagnostics (Mobile)
            </h4>
            <div className="space-y-2">
              {site.mobileAudit.diagnostics.slice(0, 3).map((diag: any, idx: number) => (
                <div key={idx} className="text-sm p-2 bg-muted/50 rounded">
                  <div className="font-medium">{diag.title}</div>
                  {diag.displayValue && (
                    <div className="text-xs text-muted-foreground mt-1">{diag.displayValue}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last Updated */}
        {(site.mobileAudit || site.desktopAudit) && (
          <div className="text-xs text-muted-foreground">
            Last audit: {new Date(
              site.mobileAudit?.created_at || site.desktopAudit?.created_at
            ).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600'
  if (score >= 50) return 'text-yellow-600'
  return 'text-red-600'
}

function getScoreVariant(score: number): 'default' | 'secondary' | 'destructive' {
  if (score >= 90) return 'default'
  if (score >= 50) return 'secondary'
  return 'destructive'
}

function getRatingColor(rating: string): string {
  if (rating === 'good') return 'text-green-600'
  if (rating === 'needs-improvement') return 'text-yellow-600'
  return 'text-red-600'
}

function formatVitalValue(metric: string, value: number): string {
  if (metric === 'CLS') return (value / 1000).toFixed(2)
  if (metric === 'INP' || metric === 'TTFB' || metric === 'FCP' || metric === 'LCP') {
    return `${Math.round(value)}ms`
  }
  return value.toString()
}
