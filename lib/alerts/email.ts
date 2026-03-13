/**
 * Gmail SMTP Email Alerts
 *
 * Setup:
 * 1. Google hesabında 2FA aktif olmalı
 * 2. App Password oluştur:
 *    - https://myaccount.google.com/apppasswords
 *    - "Select app" → Mail
 *    - "Select device" → Other (Custom name: "Webmaster App")
 *    - 16 haneli şifreyi kopyala
 * 3. .env.local'e ekle:
 *    GMAIL_USER=your-email@gmail.com
 *    GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx (boşluksuz)
 *    ALERT_EMAIL_TO=admin@example.com (bildirimlerin gönderileceği adres)
 */

import nodemailer from 'nodemailer'

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (transporter) return transporter

  const gmailUser = process.env.GMAIL_USER
  const gmailPassword = process.env.GMAIL_APP_PASSWORD

  if (!gmailUser || !gmailPassword) {
    console.warn('⚠️ Gmail SMTP not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD')
    return null
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPassword
    }
  })

  return transporter
}

export interface EmailOptions {
  to?: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const transport = getTransporter()
  if (!transport) return false

  const gmailUser = process.env.GMAIL_USER
  const alertEmailTo = options.to || process.env.ALERT_EMAIL_TO || gmailUser

  try {
    await transport.sendMail({
      from: `Webmaster Monitor <${gmailUser}>`,
      to: alertEmailTo,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '')
    })

    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

export async function sendDowntimeEmail(
  websiteName: string,
  domain: string,
  errorMessage: string,
  responseTime: number,
  statusCode: number | null
) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ef4444; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
    .info-row { margin: 10px 0; }
    .label { font-weight: bold; color: #666; }
    .value { color: #000; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🚨 DOWNTIME ALERT</h1>
    </div>
    <div class="content">
      <div class="info-row">
        <span class="label">Website:</span>
        <span class="value">${websiteName}</span>
      </div>
      <div class="info-row">
        <span class="label">Domain:</span>
        <span class="value">${domain}</span>
      </div>
      <div class="info-row">
        <span class="label">Status:</span>
        <span class="value">❌ Offline</span>
      </div>
      <div class="info-row">
        <span class="label">Status Code:</span>
        <span class="value">${statusCode || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="label">Error:</span>
        <span class="value">${errorMessage}</span>
      </div>
      <div class="info-row">
        <span class="label">Response Time:</span>
        <span class="value">${responseTime}ms</span>
      </div>
      <div class="info-row">
        <span class="label">Time:</span>
        <span class="value">${new Date().toLocaleString('tr-TR')}</span>
      </div>

      <div style="margin-top: 20px; padding: 15px; background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
        <strong>⚠️ Action Required:</strong>
        <p style="margin: 5px 0 0 0;">Your website is currently unreachable. Please investigate immediately.</p>
      </div>
    </div>
    <div class="footer">
      Webmaster Monitoring Dashboard
    </div>
  </div>
</body>
</html>
`.trim()

  return await sendEmail({
    subject: `🚨 DOWNTIME: ${websiteName} (${domain})`,
    html
  })
}

export async function sendRecoveryEmail(
  websiteName: string,
  domain: string,
  downtimeDuration: string
) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
    .info-row { margin: 10px 0; }
    .label { font-weight: bold; color: #666; }
    .value { color: #000; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">✅ RECOVERY ALERT</h1>
    </div>
    <div class="content">
      <div class="info-row">
        <span class="label">Website:</span>
        <span class="value">${websiteName}</span>
      </div>
      <div class="info-row">
        <span class="label">Domain:</span>
        <span class="value">${domain}</span>
      </div>
      <div class="info-row">
        <span class="label">Status:</span>
        <span class="value">✅ Online</span>
      </div>
      <div class="info-row">
        <span class="label">Downtime Duration:</span>
        <span class="value">${downtimeDuration}</span>
      </div>
      <div class="info-row">
        <span class="label">Time:</span>
        <span class="value">${new Date().toLocaleString('tr-TR')}</span>
      </div>

      <div style="margin-top: 20px; padding: 15px; background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
        <strong>✅ Good News:</strong>
        <p style="margin: 5px 0 0 0;">Your website is back online and accessible again.</p>
      </div>
    </div>
    <div class="footer">
      Webmaster Monitoring Dashboard
    </div>
  </div>
</body>
</html>
`.trim()

  return await sendEmail({
    subject: `✅ RECOVERED: ${websiteName} (${domain})`,
    html
  })
}

export async function sendErrorEmail(
  websiteName: string,
  errorType: string,
  errorMessage: string,
  pageUrl: string,
  stackTrace?: string
) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
    .info-row { margin: 10px 0; }
    .label { font-weight: bold; color: #666; }
    .value { color: #000; }
    .stack-trace { background: #1f2937; color: #10b981; padding: 15px; border-radius: 4px; overflow-x: auto; font-family: monospace; font-size: 12px; margin-top: 10px; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">⚠️ ERROR DETECTED</h1>
    </div>
    <div class="content">
      <div class="info-row">
        <span class="label">Website:</span>
        <span class="value">${websiteName}</span>
      </div>
      <div class="info-row">
        <span class="label">Error Type:</span>
        <span class="value">${errorType}</span>
      </div>
      <div class="info-row">
        <span class="label">Page URL:</span>
        <span class="value">${pageUrl}</span>
      </div>
      <div class="info-row">
        <span class="label">Error Message:</span>
        <span class="value">${errorMessage}</span>
      </div>
      <div class="info-row">
        <span class="label">Time:</span>
        <span class="value">${new Date().toLocaleString('tr-TR')}</span>
      </div>

      ${stackTrace ? `
      <div style="margin-top: 15px;">
        <span class="label">Stack Trace:</span>
        <div class="stack-trace">${stackTrace.substring(0, 1000)}</div>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      Webmaster Monitoring Dashboard
    </div>
  </div>
</body>
</html>
`.trim()

  return await sendEmail({
    subject: `⚠️ ERROR: ${websiteName} - ${errorType}`,
    html
  })
}

export async function testEmailConnection(): Promise<{
  success: boolean
  message: string
}> {
  const transport = getTransporter()

  if (!transport) {
    return {
      success: false,
      message: 'Gmail SMTP not configured'
    }
  }

  try {
    await transport.verify()

    const testSent = await sendEmail({
      subject: '✅ Test Email - Webmaster Alert System',
      html: `
        <h2>✅ Email System Working!</h2>
        <p>Webmaster Alert System email integration is configured correctly.</p>
        <p>Time: ${new Date().toLocaleString('tr-TR')}</p>
      `
    })

    if (testSent) {
      return {
        success: true,
        message: 'Email sent successfully'
      }
    } else {
      return {
        success: false,
        message: 'Failed to send test email'
      }
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Connection test failed'
    }
  }
}
