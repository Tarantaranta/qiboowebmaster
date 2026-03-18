import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Minus, Search, Plus } from 'lucide-react'
import Link from 'next/link'
import { AddKeywordForm } from '@/components/seo/add-keyword-form'
import { CheckRanksButton } from '@/components/seo/check-ranks-button'

export const dynamic = 'force-dynamic'

export default async function KeywordsPage() {
  const supabase = await createClient()

  // Get all websites
  const { data: websites } = await supabase
    .from('websites')
    .select('*')
    .order('name')

  // Get keywords for each website with latest position
  const websiteKeywords = await Promise.all(
    (websites || []).map(async (website) => {
      const { data: keywords } = await supabase
        .from('keywords')
        .select('*')
        .eq('website_id', website.id)
        .order('current_position', { ascending: true, nullsFirst: false })

      return {
        website,
        keywords: keywords || [],
      }
    })
  )

  // Calculate overall stats
  const totalKeywords = websiteKeywords.reduce((sum, w) => sum + w.keywords.length, 0)
  const trackingKeywords = websiteKeywords.reduce(
    (sum, w) => sum + w.keywords.filter(k => k.is_tracking).length,
    0
  )
  const rankedKeywords = websiteKeywords.reduce(
    (sum, w) => sum + w.keywords.filter(k => k.current_position !== null).length,
    0
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Keyword Tracking</h1>
          <p className="text-muted-foreground mt-2">
            Monitor your keyword rankings in Google search results
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Keywords"
          value={totalKeywords}
          icon={<Search className="h-4 w-4" />}
          description="All tracked keywords"
        />
        <StatsCard
          title="Actively Tracking"
          value={trackingKeywords}
          icon={<TrendingUp className="h-4 w-4" />}
          description="Currently monitored"
        />
        <StatsCard
          title="Ranked in Top 100"
          value={rankedKeywords}
          icon={<TrendingUp className="h-4 w-4" />}
          description="Found in Google results"
        />
        <StatsCard
          title="Websites"
          value={websites?.length || 0}
          icon={<Search className="h-4 w-4" />}
          description="Total websites"
        />
      </div>

      {/* Keywords by Website */}
      <div className="space-y-6">
        {websiteKeywords.map(({ website, keywords }) => (
          <Card key={website.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{website.name}</CardTitle>
                  <CardDescription>
                    {website.domain} - {keywords.length} keywords
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <CheckRanksButton websiteId={website.id} />
                  <AddKeywordForm websiteId={website.id} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {keywords.length > 0 ? (
                <div className="space-y-3">
                  {keywords.map((keyword) => (
                    <KeywordRow key={keyword.id} keyword={keyword} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">No keywords added yet</p>
                  <AddKeywordForm websiteId={website.id} />
                </div>
              )}
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
  value: number
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

function KeywordRow({ keyword }: { keyword: any }) {
  const position = keyword.current_position
  const difficulty = keyword.difficulty || 0

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <span className="font-medium">{keyword.keyword}</span>
          {!keyword.is_tracking && (
            <Badge variant="secondary">Paused</Badge>
          )}
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          {keyword.search_volume && (
            <span>{keyword.search_volume.toLocaleString()} searches/mo</span>
          )}
          {difficulty > 0 && (
            <span>Difficulty: {difficulty}/100</span>
          )}
          {keyword.last_checked_at && (
            <span>
              Last checked: {new Date(keyword.last_checked_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Position Badge */}
        {position !== null ? (
          <div className="text-center">
            <div className={`text-2xl font-bold ${getPositionColor(position)}`}>
              #{position}
            </div>
            <div className="text-xs text-muted-foreground">Google rank</div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-xl text-muted-foreground">—</div>
            <div className="text-xs text-muted-foreground">Not ranked</div>
          </div>
        )}

        {/* Trend Icon */}
        <div className="w-8">
          {keyword.position_change !== undefined && keyword.position_change !== 0 && (
            <>
              {keyword.position_change > 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function getPositionColor(position: number): string {
  if (position <= 3) return 'text-green-600'
  if (position <= 10) return 'text-blue-600'
  if (position <= 20) return 'text-yellow-600'
  return 'text-muted-foreground'
}
