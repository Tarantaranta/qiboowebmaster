import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'
import { checkSSLCertificate, getSSLStatus } from '@/lib/monitoring/ssl'

export const dynamic = 'force-dynamic'

export default async function SSLPage() {
  const supabase = await createClient()

  // Get all websites
  const { data: websites } = await supabase
    .from('websites')
    .select('*')
    .order('name')

  // Check SSL for each website and get latest from database
  const sslData = await Promise.all(
    (websites || []).map(async (website) => {
      // Get latest SSL check from database
      const { data: latestCheck } = await supabase
        .from('ssl_certificates')
        .select('*')
        .eq('website_id', website.id)
        .order('checked_at', { ascending: false })
        .limit(1)
        .single()

      // Perform live check
      const liveCheck = await checkSSLCertificate(website.domain)

      // Save to database
      if (liveCheck.validTo) {
        await supabase.from('ssl_certificates').insert({
          website_id: website.id,
          domain: website.domain,
          issuer: liveCheck.issuer,
          valid_from: liveCheck.validFrom ? new Date(liveCheck.validFrom).toISOString() : null,
          valid_to: liveCheck.validTo ? new Date(liveCheck.validTo).toISOString() : null,
          days_until_expiry: liveCheck.daysUntilExpiry,
          is_valid: liveCheck.isValid,
          error_message: liveCheck.error || null
        })
      }

      return {
        ...website,
        ssl: liveCheck,
        previousCheck: latestCheck
      }
    })
  )

  // Calculate stats
  const totalCerts = sslData.length
  const validCerts = sslData.filter(s => s.ssl.isValid).length
  const expiringCerts = sslData.filter(s => s.ssl.daysUntilExpiry > 0 && s.ssl.daysUntilExpiry <= 30).length
  const expiredCerts = sslData.filter(s => s.ssl.daysUntilExpiry <= 0).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">SSL Certificates</h1>
        <p className="text-muted-foreground mt-2">
          Monitor SSL certificate expiry and validity for all websites
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Certificates"
          value={totalCerts}
          icon={<Shield className="h-4 w-4" />}
        />
        <StatsCard
          title="Valid"
          value={validCerts}
          icon={<CheckCircle className="h-4 w-4 text-green-600" />}
          color="text-green-600"
        />
        <StatsCard
          title="Expiring Soon"
          value={expiringCerts}
          icon={<AlertTriangle className="h-4 w-4 text-yellow-600" />}
          color="text-yellow-600"
          description="Within 30 days"
        />
        <StatsCard
          title="Expired"
          value={expiredCerts}
          icon={<XCircle className="h-4 w-4 text-red-600" />}
          color="text-red-600"
        />
      </div>

      {/* SSL Certificates List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Certificate Status</h2>

        <div className="grid gap-4">
          {sslData.map((site) => (
            <SSLCard key={site.id} site={site} />
          ))}
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>SSL Certificate Alerts</CardTitle>
          <CardDescription>Automatic notifications for expiring certificates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="text-green-500">✅</div>
            <div>
              <p className="font-medium">30 Days Before Expiry</p>
              <p className="text-sm text-muted-foreground">First warning alert sent</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-yellow-500">⚠️</div>
            <div>
              <p className="font-medium">14 Days Before Expiry</p>
              <p className="text-sm text-muted-foreground">Second warning alert sent</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-red-500">🚨</div>
            <div>
              <p className="font-medium">7 Days & 1 Day Before Expiry</p>
              <p className="text-sm text-muted-foreground">Critical alerts sent</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatsCard({
  title,
  value,
  icon,
  color,
  description
}: {
  title: string
  value: number
  icon: React.ReactNode
  color?: string
  description?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color || ''}`}>{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

function SSLCard({ site }: { site: any }) {
  const ssl = site.ssl
  const status = getSSLStatus(ssl.daysUntilExpiry)

  const StatusIcon = ssl.daysUntilExpiry <= 0 ? XCircle :
    ssl.daysUntilExpiry <= 7 ? AlertTriangle :
    ssl.daysUntilExpiry <= 30 ? Clock : CheckCircle

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {site.name}
            </CardTitle>
            <CardDescription>{site.domain}</CardDescription>
          </div>
          <Badge variant={status.status === 'valid' ? 'default' : status.status === 'expired' ? 'destructive' : 'secondary'}>
            <StatusIcon className="h-4 w-4 mr-1" />
            {status.message}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {ssl.error ? (
          <div className="text-red-600 text-sm">
            ❌ Error: {ssl.error}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Issuer</p>
              <p className="font-medium">{ssl.issuer}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Valid From</p>
              <p className="font-medium">
                {ssl.validFrom ? new Date(ssl.validFrom).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Valid Until</p>
              <p className="font-medium">
                {ssl.validTo ? new Date(ssl.validTo).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Days Remaining</p>
              <p className={`font-medium ${status.color}`}>
                {ssl.daysUntilExpiry} days
              </p>
            </div>
          </div>
        )}

        {site.previousCheck && (
          <div className="mt-4 text-xs text-muted-foreground">
            Last checked: {new Date(site.previousCheck.checked_at).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
