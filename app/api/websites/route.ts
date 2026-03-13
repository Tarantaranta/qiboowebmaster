import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET all websites
export async function GET() {
  const supabase = await createClient()

  const { data: websites, error } = await supabase
    .from('websites')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ websites })
}

// POST create new website
export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const body = await request.json()
    const { name, domain, description, vercel_project_id, ga_property_id } = body

    // Validate required fields
    if (!name || !domain) {
      return NextResponse.json(
        { error: 'Name and domain are required' },
        { status: 400 }
      )
    }

    // Clean domain (remove http/https and trailing slash)
    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
      .toLowerCase()

    // Insert website
    const { data: website, error } = await supabase
      .from('websites')
      .insert({
        name,
        domain: cleanDomain,
        description: description || '',
        vercel_project_id: vercel_project_id || null,
        ga_property_id: ga_property_id || null,
        status: 'unknown'
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'Domain already exists' },
          { status: 409 }
        )
      }
      throw error
    }

    // Create default alert settings for this website
    await supabase.from('alert_settings').insert([
      {
        website_id: website.id,
        alert_type: 'uptime',
        enabled: true,
        telegram_enabled: true,
        email_enabled: true,
        threshold: { max_downtime_minutes: 5 }
      },
      {
        website_id: website.id,
        alert_type: 'error',
        enabled: true,
        telegram_enabled: true,
        email_enabled: true,
        threshold: { min_errors_per_hour: 10 }
      },
      {
        website_id: website.id,
        alert_type: 'ssl_expiry',
        enabled: true,
        telegram_enabled: false,
        email_enabled: true,
        threshold: { days_before_expiry: 7 }
      }
    ])

    return NextResponse.json({ website }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating website:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create website' },
      { status: 500 }
    )
  }
}
