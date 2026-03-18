import { WeeklyReportData } from './weekly-report'
import nodemailer from 'nodemailer'

/**
 * Generate HTML email template for weekly report
 */
export function generateWeeklyReportEmail(report: WeeklyReportData): string {
  const changeIcon = (value: number) => value > 0 ? '📈' : value < 0 ? '📉' : '➡️'
  const changeColor = (value: number) => value > 0 ? '#10b981' : value < 0 ? '#ef4444' : '#6b7280'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Report - ${report.websiteName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1f2937;
      margin: 0;
      font-size: 28px;
    }
    .header p {
      color: #6b7280;
      margin: 10px 0 0 0;
      font-size: 14px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    .metric-card {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #3b82f6;
    }
    .metric-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .metric-value {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
    }
    .metric-change {
      font-size: 12px;
      margin-top: 5px;
    }
    .list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .list-item {
      padding: 10px;
      background-color: #f9fafb;
      border-radius: 4px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .list-item-title {
      font-size: 14px;
      color: #374151;
      font-weight: 500;
    }
    .list-item-value {
      font-size: 14px;
      color: #6b7280;
      font-weight: 600;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      margin-top: 30px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 12px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-success { background-color: #d1fae5; color: #065f46; }
    .badge-warning { background-color: #fef3c7; color: #92400e; }
    .badge-danger { background-color: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>📊 Weekly Report</h1>
      <p><strong>${report.websiteName}</strong> (${report.domain})</p>
      <p>${report.dateRange.startDate} → ${report.dateRange.endDate}</p>
    </div>

    <!-- Traffic Section -->
    <div class="section">
      <div class="section-title">🚀 Traffic Overview</div>
      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-label">Total Pageviews</div>
          <div class="metric-value">${report.traffic.totalPageviews.toLocaleString()}</div>
          <div class="metric-change" style="color: ${changeColor(report.traffic.changeFromLastWeek.pageviews)}">
            ${changeIcon(report.traffic.changeFromLastWeek.pageviews)} ${Math.abs(report.traffic.changeFromLastWeek.pageviews).toLocaleString()} from last week
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Unique Visitors</div>
          <div class="metric-value">${report.traffic.uniqueVisitors.toLocaleString()}</div>
          <div class="metric-change" style="color: ${changeColor(report.traffic.changeFromLastWeek.visitors)}">
            ${changeIcon(report.traffic.changeFromLastWeek.visitors)} ${Math.abs(report.traffic.changeFromLastWeek.visitors).toLocaleString()} from last week
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Avg. Session Duration</div>
          <div class="metric-value">${Math.floor(report.traffic.avgSessionDuration / 60)}m ${report.traffic.avgSessionDuration % 60}s</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Bounce Rate</div>
          <div class="metric-value">${report.traffic.bounceRate.toFixed(1)}%</div>
        </div>
      </div>
    </div>

    <!-- Top Pages -->
    ${report.topPages.length > 0 ? `
    <div class="section">
      <div class="section-title">📄 Top Pages</div>
      <ul class="list">
        ${report.topPages.slice(0, 5).map(page => `
          <li class="list-item">
            <span class="list-item-title">${page.url}</span>
            <span class="list-item-value">${page.pageviews.toLocaleString()} views</span>
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    <!-- Performance -->
    <div class="section">
      <div class="section-title">⚡ Performance</div>
      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-label">Performance Score</div>
          <div class="metric-value">${report.performance.performanceScore}/100</div>
          <span class="badge ${report.performance.performanceScore >= 90 ? 'badge-success' : report.performance.performanceScore >= 50 ? 'badge-warning' : 'badge-danger'}">
            ${report.performance.performanceScore >= 90 ? 'Good' : report.performance.performanceScore >= 50 ? 'Needs Work' : 'Poor'}
          </span>
        </div>
        <div class="metric-card">
          <div class="metric-label">Largest Contentful Paint</div>
          <div class="metric-value">${report.performance.coreWebVitals.lcp}ms</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Interaction to Next Paint</div>
          <div class="metric-value">${report.performance.coreWebVitals.inp}ms</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Cumulative Layout Shift</div>
          <div class="metric-value">${(report.performance.coreWebVitals.cls / 1000).toFixed(3)}</div>
        </div>
      </div>
    </div>

    <!-- SEO -->
    <div class="section">
      <div class="section-title">🔍 SEO Performance</div>
      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-label">Google Clicks</div>
          <div class="metric-value">${report.seo.totalClicks.toLocaleString()}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Impressions</div>
          <div class="metric-value">${report.seo.totalImpressions.toLocaleString()}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Avg. Position</div>
          <div class="metric-value">${report.seo.avgPosition.toFixed(1)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Top 10 Keywords</div>
          <div class="metric-value">${report.keywords.top10Count}</div>
        </div>
      </div>

      ${report.seo.topQueries.length > 0 ? `
        <div style="margin-top: 20px;">
          <strong style="font-size: 14px; color: #6b7280;">Top Search Queries:</strong>
          <ul class="list" style="margin-top: 10px;">
            ${report.seo.topQueries.slice(0, 5).map(query => `
              <li class="list-item">
                <span class="list-item-title">${query.query}</span>
                <span class="list-item-value">${query.clicks} clicks • Pos. ${query.position.toFixed(1)}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
    </div>

    <!-- Uptime & Errors -->
    <div class="section">
      <div class="section-title">🔧 Health & Errors</div>
      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-label">Uptime</div>
          <div class="metric-value">${report.uptime.uptimePercentage.toFixed(2)}%</div>
          <span class="badge ${report.uptime.uptimePercentage >= 99.9 ? 'badge-success' : report.uptime.uptimePercentage >= 99 ? 'badge-warning' : 'badge-danger'}">
            ${report.uptime.incidents} incident${report.uptime.incidents !== 1 ? 's' : ''}
          </span>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total Errors</div>
          <div class="metric-value">${report.errors.totalErrors}</div>
          <div class="metric-change" style="color: ${report.errors.unresolvedErrors > 0 ? '#ef4444' : '#10b981'}">
            ${report.errors.unresolvedErrors} unresolved
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Generated with 🤖 <strong>Webmaster Dashboard</strong></p>
      <p>This is an automated weekly report for ${report.domain}</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Send weekly report email
 */
export async function sendWeeklyReportEmail(
  report: WeeklyReportData,
  recipientEmail: string
): Promise<boolean> {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    // Generate email HTML
    const html = generateWeeklyReportEmail(report)

    // Send email
    await transporter.sendMail({
      from: `"Webmaster Dashboard" <${process.env.GMAIL_USER}>`,
      to: recipientEmail,
      subject: `📊 Weekly Report: ${report.websiteName} (${report.dateRange.startDate} - ${report.dateRange.endDate})`,
      html,
    })

    console.log(`✅ Weekly report sent to ${recipientEmail} for ${report.domain}`)
    return true
  } catch (error: any) {
    console.error(`❌ Failed to send report email for ${report.domain}:`, error.message)
    return false
  }
}

/**
 * Send weekly reports for all websites
 */
export async function sendAllWeeklyReports(recipientEmail: string): Promise<number> {
  const { generateAllWeeklyReports } = await import('./weekly-report')
  const reports = await generateAllWeeklyReports()

  let successCount = 0

  for (const report of reports) {
    const success = await sendWeeklyReportEmail(report, recipientEmail)
    if (success) successCount++

    // Wait 2 seconds between emails
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  return successCount
}
