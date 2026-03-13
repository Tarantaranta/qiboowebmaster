import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET single website
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const { data: website, error } = await supabase
    .from('websites')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json({ website })
}

// PATCH update website
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  try {
    const body = await request.json()
    const { name, domain, description, vercel_project_id, ga_property_id } = body

    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (domain !== undefined) {
      updates.domain = domain
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '')
        .toLowerCase()
    }
    if (description !== undefined) updates.description = description
    if (vercel_project_id !== undefined) updates.vercel_project_id = vercel_project_id
    if (ga_property_id !== undefined) updates.ga_property_id = ga_property_id

    const { data: website, error } = await supabase
      .from('websites')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ website })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update website' },
      { status: 500 }
    )
  }
}

// DELETE website
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  try {
    const { error } = await supabase
      .from('websites')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete website' },
      { status: 500 }
    )
  }
}
