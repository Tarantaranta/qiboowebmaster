import { createClient } from '@/lib/supabase/server'
import { sendDowntimeAlert, sendRecoveryAlert, sendErrorAlert } from './telegram'
import { sendDowntimeEmail, sendRecoveryEmail, sendErrorEmail } from './email'

export type AlertType = 'downtime' | 'recovery' | 'error' | 'high_error_rate'

export interface AlertConfig {
  telegram_enabled: boolean
  email_enabled: boolean
  downtime_threshold: number // minutes before alerting
  error_rate_threshold: number // errors per hour
}

export async function getAlertConfig(websiteId: string): Promise<AlertConfig> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('alert_settings')
    .select('*')
    .eq('website_id', websiteId)
    .single()

  if (!data) {
    // Default settings
    return {
      telegram_enabled: true,
      email_enabled: true,
      downtime_threshold: 0, // Alert immediately
      error_rate_threshold: 10
    }
  }

  return {
    telegram_enabled: data.sms_enabled ?? true, // Using sms_enabled field for telegram
    email_enabled: data.email_enabled ?? true,
    downtime_threshold: 0,
    error_rate_threshold: 10
  }
}

export async function triggerDowntimeAlert(
  websiteId: string,
  websiteName: string,
  domain: string,
  errorMessage: string,
  responseTime: number,
  statusCode: number | null
) {
  const config = await getAlertConfig(websiteId)

  let telegramSent = false
  let emailSent = false

  // Send Telegram alert
  if (config.telegram_enabled) {
    telegramSent = await sendDowntimeAlert(
      websiteName,
      domain,
      errorMessage,
      responseTime
    )
  }

  // Send Email alert
  if (config.email_enabled) {
    emailSent = await sendDowntimeEmail(
      websiteName,
      domain,
      errorMessage,
      responseTime,
      statusCode
    )
  }

  // Log alert to database
  await logAlert(websiteId, 'downtime', {
    telegram_sent: telegramSent,
    email_sent: emailSent,
    domain,
    error_message: errorMessage,
    response_time: responseTime,
    status_code: statusCode
  })

  return { telegramSent, emailSent }
}

export async function triggerRecoveryAlert(
  websiteId: string,
  websiteName: string,
  domain: string,
  downtimeStartedAt: Date
) {
  const config = await getAlertConfig(websiteId)

  const downtimeDuration = calculateDuration(downtimeStartedAt, new Date())

  let telegramSent = false
  let emailSent = false

  // Send Telegram alert
  if (config.telegram_enabled) {
    telegramSent = await sendRecoveryAlert(
      websiteName,
      domain,
      downtimeDuration
    )
  }

  // Send Email alert
  if (config.email_enabled) {
    emailSent = await sendRecoveryEmail(
      websiteName,
      domain,
      downtimeDuration
    )
  }

  // Log alert
  await logAlert(websiteId, 'recovery', {
    telegram_sent: telegramSent,
    email_sent: emailSent,
    domain,
    downtime_duration: downtimeDuration
  })

  return { telegramSent, emailSent }
}

export async function triggerErrorAlert(
  websiteId: string,
  websiteName: string,
  errorType: string,
  errorMessage: string,
  pageUrl: string,
  stackTrace?: string
) {
  const config = await getAlertConfig(websiteId)

  let telegramSent = false
  let emailSent = false

  // Send Telegram alert
  if (config.telegram_enabled) {
    telegramSent = await sendErrorAlert(
      websiteName,
      errorType,
      errorMessage,
      pageUrl
    )
  }

  // Send Email alert
  if (config.email_enabled) {
    emailSent = await sendErrorEmail(
      websiteName,
      errorType,
      errorMessage,
      pageUrl,
      stackTrace
    )
  }

  // Log alert
  await logAlert(websiteId, 'error', {
    telegram_sent: telegramSent,
    email_sent: emailSent,
    error_type: errorType,
    error_message: errorMessage,
    page_url: pageUrl
  })

  return { telegramSent, emailSent }
}

async function logAlert(
  websiteId: string,
  alertType: AlertType,
  metadata: any
) {
  const supabase = await createClient()

  await supabase.from('alert_history').insert({
    website_id: websiteId,
    alert_type: alertType,
    sent_at: new Date().toISOString(),
    channels: {
      telegram: metadata.telegram_sent || false,
      email: metadata.email_sent || false
    },
    metadata
  })
}

function calculateDuration(start: Date, end: Date): string {
  const diffMs = end.getTime() - start.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) {
    return `${diffDays} gün ${diffHours % 24} saat`
  } else if (diffHours > 0) {
    return `${diffHours} saat ${diffMins % 60} dakika`
  } else if (diffMins > 0) {
    return `${diffMins} dakika`
  } else {
    return `${Math.floor(diffMs / 1000)} saniye`
  }
}

export async function checkErrorRateAndAlert(websiteId: string) {
  const supabase = await createClient()
  const config = await getAlertConfig(websiteId)

  // Get errors from last hour
  const oneHourAgo = new Date()
  oneHourAgo.setHours(oneHourAgo.getHours() - 1)

  const { data: errors, count } = await supabase
    .from('error_logs')
    .select('*', { count: 'exact' })
    .eq('website_id', websiteId)
    .gte('created_at', oneHourAgo.toISOString())
    .eq('is_resolved', false)

  if (count && count > config.error_rate_threshold) {
    // Check if we already sent alert in last hour
    const { data: recentAlerts } = await supabase
      .from('alert_history')
      .select('*')
      .eq('website_id', websiteId)
      .eq('alert_type', 'high_error_rate')
      .gte('sent_at', oneHourAgo.toISOString())

    if (!recentAlerts || recentAlerts.length === 0) {
      const { data: website } = await supabase
        .from('websites')
        .select('name, domain')
        .eq('id', websiteId)
        .single()

      if (website) {
        await triggerErrorAlert(
          websiteId,
          website.name,
          'High Error Rate',
          `${count} errors detected in the last hour (threshold: ${config.error_rate_threshold})`,
          website.domain
        )
      }
    }
  }
}
