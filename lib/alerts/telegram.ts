/**
 * Telegram Bot API Integration for Alerts
 *
 * Setup:
 * 1. @BotFather ile bot oluştur: /newbot
 * 2. Bot token'ı al ve .env.local'e ekle: TELEGRAM_BOT_TOKEN
 * 3. Kendi chat ID'ni al:
 *    - Bot'a mesaj gönder
 *    - https://api.telegram.org/bot<TOKEN>/getUpdates adresine git
 *    - "chat":{"id": 123456789} değerini bul
 * 4. Chat ID'yi .env.local'e ekle: TELEGRAM_CHAT_ID
 */

const TELEGRAM_API_BASE = 'https://api.telegram.org'

export interface TelegramMessage {
  text: string
  parse_mode?: 'Markdown' | 'HTML'
  disable_notification?: boolean
}

export async function sendTelegramMessage(
  message: string,
  parseMode: 'Markdown' | 'HTML' = 'HTML',
  silent = false
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    console.warn('⚠️ Telegram not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID')
    return false
  }

  try {
    const response = await fetch(
      `${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: parseMode,
          disable_notification: silent
        })
      }
    )

    const data = await response.json()

    if (!data.ok) {
      console.error('Telegram API error:', data)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to send Telegram message:', error)
    return false
  }
}

export async function sendDowntimeAlert(
  websiteName: string,
  domain: string,
  errorMessage: string,
  responseTime: number
) {
  const message = `
🚨 <b>DOWNTIME ALERT</b>

<b>Website:</b> ${websiteName}
<b>Domain:</b> ${domain}
<b>Status:</b> ❌ Offline
<b>Error:</b> ${errorMessage}
<b>Response Time:</b> ${responseTime}ms
<b>Time:</b> ${new Date().toLocaleString('tr-TR')}

⚠️ Site erişilemiyor durumda!
`.trim()

  return await sendTelegramMessage(message)
}

export async function sendRecoveryAlert(
  websiteName: string,
  domain: string,
  downtimeDuration: string
) {
  const message = `
✅ <b>RECOVERY ALERT</b>

<b>Website:</b> ${websiteName}
<b>Domain:</b> ${domain}
<b>Status:</b> ✅ Online
<b>Downtime Duration:</b> ${downtimeDuration}
<b>Time:</b> ${new Date().toLocaleString('tr-TR')}

Site tekrar erişilebilir durumda.
`.trim()

  return await sendTelegramMessage(message, 'HTML', true) // Silent notification
}

export async function sendErrorAlert(
  websiteName: string,
  errorType: string,
  errorMessage: string,
  pageUrl: string
) {
  const message = `
⚠️ <b>ERROR DETECTED</b>

<b>Website:</b> ${websiteName}
<b>Error Type:</b> ${errorType}
<b>Page:</b> ${pageUrl}
<b>Message:</b> ${errorMessage.substring(0, 200)}
<b>Time:</b> ${new Date().toLocaleString('tr-TR')}
`.trim()

  return await sendTelegramMessage(message)
}

export async function sendDailyReport(stats: {
  total_websites: number
  online: number
  offline: number
  avg_uptime: number
  total_visitors: number
  total_errors: number
}) {
  const message = `
📊 <b>DAILY REPORT</b>

<b>Websites:</b> ${stats.total_websites}
<b>Online:</b> ✅ ${stats.online}
<b>Offline:</b> ❌ ${stats.offline}
<b>Avg Uptime:</b> ${stats.avg_uptime.toFixed(2)}%

<b>Visitors (24h):</b> ${stats.total_visitors}
<b>Errors (24h):</b> ${stats.total_errors}

<b>Date:</b> ${new Date().toLocaleDateString('tr-TR')}
`.trim()

  return await sendTelegramMessage(message, 'HTML', true)
}

export async function testTelegramConnection(): Promise<{
  success: boolean
  message: string
}> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken) {
    return {
      success: false,
      message: 'TELEGRAM_BOT_TOKEN not configured'
    }
  }

  if (!chatId) {
    return {
      success: false,
      message: 'TELEGRAM_CHAT_ID not configured'
    }
  }

  try {
    // Test bot info
    const botResponse = await fetch(
      `${TELEGRAM_API_BASE}/bot${botToken}/getMe`
    )
    const botData = await botResponse.json()

    if (!botData.ok) {
      return {
        success: false,
        message: `Invalid bot token: ${botData.description}`
      }
    }

    // Send test message
    const testMessage = `
✅ <b>Test Message</b>

Webmaster Alert System çalışıyor!

Bot: @${botData.result.username}
Time: ${new Date().toLocaleString('tr-TR')}
`.trim()

    const sent = await sendTelegramMessage(testMessage)

    if (sent) {
      return {
        success: true,
        message: `Bot connected: @${botData.result.username}`
      }
    } else {
      return {
        success: false,
        message: 'Failed to send test message'
      }
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Connection test failed'
    }
  }
}
