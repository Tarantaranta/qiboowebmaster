import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

  const { data: keywords, error } = await supabase
    .from('keywords')
    .select('*')
    .eq('website_id', website_id)
    .order('current_position', { ascending: true, nullsFirst: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ keywords })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const { website_id, keyword, search_volume, difficulty } = await request.json()

    if (!website_id || !keyword) {
      return NextResponse.json(
        { error: 'website_id and keyword are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('keywords')
      .insert({
        website_id,
        keyword: keyword.toLowerCase().trim(),
        search_volume,
        difficulty,
        is_tracking: true
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Bu keyword zaten takip ediliyor' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({ keyword: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
