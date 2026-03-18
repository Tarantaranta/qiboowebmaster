'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Globe, Monitor, Smartphone, Tablet, Clock, Radio } from 'lucide-react'

interface RealtimeData {
  activeVisitors: number
  recentPageviews: {
    page: string
    country: string
    device: string
    domain: string
    timestamp: string
    referrer: string
  }[]
  activePages: { page: string; count: number }[]
  countries: { country: string; count: number }[]
  devices: { device: string; count: number }[]
  timestamp: string
  error?: string
}

export function RealtimeDashboard() {
  const [data, setData] = useState<RealtimeData | null>(null)
  const [connected, setConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const connect = () => {
      const es = new EventSource('/api/realtime/stream')
      eventSourceRef.current = es

      es.onopen = () => setConnected(true)

      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data)
          if (!parsed.error) {
            setData(parsed)
          }
        } catch {
          // Skip malformed messages
        }
      }

      es.onerror = () => {
        setConnected(false)
        es.close()
        // Reconnect after 3 seconds
        setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      eventSourceRef.current?.close()
    }
  }, [])

  const getDeviceIcon = (device: string) => {
    if (device === 'mobile') return <Smartphone className="h-4 w-4" />
    if (device === 'tablet') return <Tablet className="h-4 w-4" />
    return <Monitor className="h-4 w-4" />
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diffSec < 60) return `${diffSec}s ago`
    const diffMin = Math.floor(diffSec / 60)
    return `${diffMin}m ago`
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-sm text-muted-foreground">
          {connected ? 'Live - updating every 5 seconds' : 'Reconnecting...'}
        </span>
        {data?.timestamp && (
          <span className="text-xs text-muted-foreground ml-auto">
            Last update: {new Date(data.timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Active Visitors - Hero Card */}
      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-4">
            <Radio className="h-8 w-8 text-primary animate-pulse" />
            <div className="text-center">
              <div className="text-6xl font-bold text-primary">
                {data?.activeVisitors ?? '-'}
              </div>
              <p className="text-muted-foreground mt-1">Active visitors right now</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Live Page Views */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Live Pageviews
            </CardTitle>
            <CardDescription>Latest visitor activity (last 5 minutes)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {data?.recentPageviews && data.recentPageviews.length > 0 ? (
                data.recentPageviews.map((pv, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2 rounded-lg border bg-card text-sm"
                  >
                    {getDeviceIcon(pv.device)}
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs truncate" title={pv.page}>
                        {pv.page}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {pv.domain} | {pv.country}
                        {pv.referrer !== 'direct' && ` | via ${pv.referrer}`}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatTime(pv.timestamp)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No recent pageviews
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Active Pages
            </CardTitle>
            <CardDescription>Pages being viewed right now</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.activePages && data.activePages.length > 0 ? (
                data.activePages.map((page, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm font-mono truncate max-w-[300px]" title={page.page}>
                      {page.page}
                    </span>
                    <Badge variant="secondary">{page.count}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No active pages
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Visitor Countries
            </CardTitle>
            <CardDescription>Where your current visitors are from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.countries && data.countries.length > 0 ? (
                data.countries.map((c, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm">{c.country}</span>
                    <Badge variant="secondary">{c.count}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No country data
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Devices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Devices
            </CardTitle>
            <CardDescription>Active visitor device breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.devices && data.devices.length > 0 ? (
                data.devices.map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {getDeviceIcon(d.device)}
                    <span className="text-sm capitalize flex-1">{d.device}</span>
                    <Badge variant="secondary">{d.count}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No device data
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
