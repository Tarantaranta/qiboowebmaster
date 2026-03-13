import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Service role client for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if any users exist
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()

    if (existingUsers && existingUsers.users.length > 0) {
      return NextResponse.json(
        { error: 'Kayıt kapalı - kullanıcı zaten mevcut' },
        { status: 403 }
      )
    }

    // Create first user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (error) throw error

    return NextResponse.json({ success: true, user: data.user })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
