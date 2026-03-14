import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp, TrendingDown, Minus, Search, FileText,
  Link2, Image, Zap, CheckCircle2, AlertCircle, Sparkles,
  Globe, Clock, Activity
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { SeoAnalyzeButton } from '@/components/dashboard/seo-analyze-button'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ domain: string }>
}

export default async function WebsiteDetailPage({ params }: PageProps) {
  const { domain } = await params
  const supabase = await createClient()

  const { data: website } = await supabase
    .from('websites')
    .select('*')
    .eq('domain', domain)
    .single()

  if (!website) {
    notFound()
  }

  const { data: latestAudit } = await supabase
    .from('seo_audits')
    .select('*')
    .eq('website_id', website.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { data: keywords } = await supabase
    .from('keywords')
    .select('*')
    .eq('website_id', website.id)
    .order('current_position', { ascending: true, nullsFirst: false })
    .limit(10)

  const { data: recommendations } = await supabase
    .from('seo_recommendations')
    .select('*')
    .eq('website_id', website.id)
    .eq('is_implemented', false)
    .order('priority', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              ← Geri
            </Link>
          </div>
          <h1 className="text-4xl font-bold">{website.name}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <a
              href={`https://${website.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-foreground"
            >
              <Globe className="h-4 w-4" />
              {website.domain}
            </a>
            <Badge variant={website.status === 'online' ? 'success' : 'secondary'}>
              <Activity className="h-3 w-3 mr-1" />
              {website.status}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <SeoAnalyzeButton
            websiteId={website.id}
            url={`https://${website.domain}`}
          />
        </div>
      </div>

      {latestAudit && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>SEO Skoru</span>
              <div className="flex items-center gap-2">
                <span className={`text-4xl font-bold ${
                  latestAudit.score >= 80 ? 'text-green-600' :
                  latestAudit.score >= 60 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {latestAudit.score}
                </span>
                <span className="text-muted-foreground">/100</span>
              </div>
            </CardTitle>
            <CardDescription>
              Son analiz: {formatDate(latestAudit.created_at)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestAudit.issues && (latestAudit.issues as any[]).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Tespit Edilen Sorunlar</h4>
                <div className="space-y-2">
                  {(latestAudit.issues as any[]).map((issue: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm p-3 rounded-lg bg-muted">
                      <AlertCircle className={`h-4 w-4 mt-0.5 ${
                        issue.severity === 'high' ? 'text-red-500' :
                        issue.severity === 'medium' ? 'text-yellow-500' :
                        'text-blue-500'
                      }`} />
                      <div>
                        <p className="font-medium">{issue.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Öncelik: {issue.severity === 'high' ? 'Yüksek' : issue.severity === 'medium' ? 'Orta' : 'Düşük'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {latestAudit.ai_analysis && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Önerileri
                </h4>
                <div className="prose prose-sm max-w-none bg-primary/5 p-4 rounded-lg">
                  <p className="whitespace-pre-wrap text-sm">{latestAudit.ai_analysis}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Meta Title"
          value={latestAudit?.meta_title ? `${latestAudit.meta_title.length} karakter` : 'N/A'}
          icon={<FileText className="h-4 w-4" />}
          status={latestAudit?.meta_title && latestAudit.meta_title.length >= 30 && latestAudit.meta_title.length <= 60 ? 'good' : 'warning'}
        />
        <StatCard
          title="H1 Tags"
          value={latestAudit?.h1_tags?.length || 0}
          icon={<FileText className="h-4 w-4" />}
          status={latestAudit?.h1_tags?.length === 1 ? 'good' : 'warning'}
        />
        <StatCard
          title="Görseller"
          value={`${latestAudit?.images_count || 0} adet`}
          icon={<Image className="h-4 w-4" />}
          status={latestAudit?.images_without_alt === 0 ? 'good' : 'warning'}
          subtitle={latestAudit?.images_without_alt ? `${latestAudit.images_without_alt} alt eksik` : undefined}
        />
        <StatCard
          title="Kelime Sayısı"
          value={latestAudit?.word_count || 0}
          icon={<FileText className="h-4 w-4" />}
          status={(latestAudit?.word_count || 0) >= 300 ? 'good' : 'warning'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Top Keywords
            </CardTitle>
            <CardDescription>
              En iyi performans gösteren keyword'ler
            </CardDescription>
          </CardHeader>
          <CardContent>
            {keywords && keywords.length > 0 ? (
              <div className="space-y-3">
                {keywords.map((keyword) => (
                  <div key={keyword.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{keyword.keyword}</p>
                      {keyword.url && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {keyword.url}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {keyword.current_position && (
                        <Badge variant="outline" className="font-mono">
                          #{keyword.current_position}
                        </Badge>
                      )}
                      {keyword.previous_position && keyword.current_position && (
                        <div className="flex items-center gap-1 text-xs">
                          {keyword.current_position < keyword.previous_position ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : keyword.current_position > keyword.previous_position ? (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          ) : (
                            <Minus className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Henüz keyword eklenmemiş</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Önerileri
            </CardTitle>
            <CardDescription>
              Yapay zeka destekli SEO tavsiyeleri
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recommendations && recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="p-3 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant={
                        rec.priority === 'critical' ? 'destructive' :
                        rec.priority === 'high' ? 'warning' :
                        'secondary'
                      } className="text-xs">
                        {rec.priority}
                      </Badge>
                      {rec.impact_score && (
                        <span className="text-xs text-muted-foreground">
                          Impact: {rec.impact_score}/100
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-sm">{rec.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>AI önerileri oluşturuluyor...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  status,
  subtitle
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  status?: 'good' | 'warning' | 'error'
  subtitle?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={
          status === 'good' ? 'text-green-600' :
          status === 'warning' ? 'text-yellow-600' :
          status === 'error' ? 'text-red-600' :
          'text-muted-foreground'
        }>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}
