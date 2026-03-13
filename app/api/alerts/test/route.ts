import { NextResponse } from 'next/server'
import { testTelegramConnection } from '@/lib/alerts/telegram'
import { testEmailConnection } from '@/lib/alerts/email'

export async function POST(request: Request) {
  try {
    const { type } = await request.json()

    if (type === 'telegram') {
      const result = await testTelegramConnection()
      return NextResponse.json(result)
    } else if (type === 'email') {
      const result = await testEmailConnection()
      return NextResponse.json(result)
    } else if (type === 'all') {
      const [telegram, email] = await Promise.all([
        testTelegramConnection(),
        testEmailConnection()
      ])

      return NextResponse.json({
        telegram,
        email,
        overall: telegram.success && email.success
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Use: telegram, email, or all' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
