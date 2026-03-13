import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateKeywordSuggestions } from '@/lib/openai'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const website_id = searchParams.get('website_id')

  if (!website_id) {
    return NextResponse.json(
      { error: 'website_id is required' },
      { status: 400 }
    )
  }

  const { data: recommendations, error } = await supabase
    .from('seo_recommendations')
    .select('*')
    .eq('website_id', website_id)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ recommendations })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const { website_id } = await request.json()

    if (!website_id) {
      return NextResponse.json(
        { error: 'website_id is required' },
        { status: 400 }
      )
    }

    const { data: website } = await supabase
      .from('websites')
      .select('name, domain, description')
      .eq('id', website_id)
      .single()

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      )
    }

    const { data: keywords } = await supabase
      .from('keywords')
      .select('keyword')
      .eq('website_id', website_id)

    const currentKeywords = keywords?.map(k => k.keyword) || []

    let suggestions: string[] = []
    try {
      suggestions = await generateKeywordSuggestions(
        website.name,
        website.description || '',
        currentKeywords
      )
    } catch (error) {
      console.error('AI keyword generation failed:', error)
      suggestions = []
    }

    const recommendations = suggestions.slice(0, 10).map((keyword, index) => ({
      website_id,
      category: 'keywords',
      priority: index < 3 ? 'high' : 'medium',
      title: `"${keyword}" keyword'ünü hedefle`,
      description: `Bu keyword siteniz için yüksek potansiyele sahip. İçerik oluşturarak bu keyword'de rank almayı hedefleyin.`,
      impact_score: 80 - index * 5,
      effort_score: 60,
      ai_generated: true
    }))

    if (recommendations.length > 0) {
      const { error } = await supabase
        .from('seo_recommendations')
        .insert(recommendations)

      if (error) throw error
    }

    return NextResponse.json({
      success: true,
      count: recommendations.length,
      recommendations
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
