'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  PlayCircle,
  RefreshCw,
  MessageSquare,
  Calendar,
  Globe,
  Shield,
  Zap,
  Search,
  AlertCircle,
  CheckCircle,
  Loader2,
  Activity
} from 'lucide-react'

interface Website {
  id: string
  name: string
  domain: string
}

interface ManualActionsGridProps {
  websites: Website[]
}

export function ManualActionsGrid({ websites }: ManualActionsGridProps) {
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [results, setResults] = useState<Record<string, any>>({})

  const runAction = async (actionId: string, endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any) => {
    setLoading(prev => ({ ...prev, [actionId]: true }))
    setResults(prev => ({ ...prev, [actionId]: null }))

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      const data = await response.json()

      setResults(prev => ({
        ...prev,
        [actionId]: {
          success: response.ok,
          data,
          status: response.status
        }
      }))
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        [actionId]: {
          success: false,
          error: error.message
        }
      }))
    } finally {
      setLoading(prev => ({ ...prev, [actionId]: false }))
    }
  }

  const actions = [
    {
      id: 'search-console-sync',
      title: 'Search Console Sync',
      description: 'Son 7 günün SEO verilerini çek',
      icon: Search,
      color: 'text-blue-600',
      endpoint: '/api/cron/search-console-sync',
    },
    {
      id: 'pagespeed-check',
      title: 'PageSpeed Check',
      description: 'Tüm sitelerin performansını test et',
      icon: Zap,
      color: 'text-yellow-600',
      endpoint: '/api/cron/pagespeed-check',
    },
    {
      id: 'uptime-check',
      title: 'Uptime Check',
      description: 'Site erişilebilirliğini kontrol et',
      icon: Activity,
      color: 'text-green-600',
      endpoint: '/api/cron/uptime-check',
    },
    {
      id: 'health-check',
      title: 'Smart Health Check',
      description: 'Kapsamlı sağlık kontrolü',
      icon: Shield,
      color: 'text-purple-600',
      endpoint: '/api/cron/smart-health-check',
    },
  ]

  // Website-specific actions
  const websiteActions = websites.map(website => [
    {
      id: `chatbot-${website.id}`,
      title: `Chatbot Test (${website.name})`,
      description: 'Chatbot\'un çalışıp çalışmadığını kontrol et',
      icon: MessageSquare,
      color: 'text-pink-600',
      endpoint: '/api/test/chatbot',
      websiteId: website.id,
      domain: website.domain,
    },
    {
      id: `calendar-${website.id}`,
      title: `Calendar Test (${website.name})`,
      description: 'Takvim entegrasyonunu test et',
      icon: Calendar,
      color: 'text-orange-600',
      endpoint: '/api/test/calendar',
      websiteId: website.id,
      domain: website.domain,
    },
    {
      id: `ssl-${website.id}`,
      title: `SSL Check (${website.name})`,
      description: 'SSL sertifikası geçerliliğini kontrol et',
      icon: Shield,
      color: 'text-indigo-600',
      endpoint: '/api/test/ssl',
      websiteId: website.id,
      domain: website.domain,
    },
  ]).flat()

  const allActions = [...actions, ...websiteActions]

  return (
    <div className="space-y-8">
      {/* Global Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Global Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map(action => {
            const Icon = action.icon
            const isLoading = loading[action.id]
            const result = results[action.id]

            return (
              <div key={action.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${action.color}`} />
                    <div>
                      <h3 className="font-medium">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => runAction(action.id, action.endpoint)}
                  disabled={isLoading}
                  className="w-full"
                  size="sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Run Now
                    </>
                  )}
                </Button>

                {result && (
                  <div className={`text-sm p-2 rounded ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {result.success ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>Success: {JSON.stringify(result.data).slice(0, 100)}...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <span>Error: {result.error || JSON.stringify(result.data)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Website-Specific Actions */}
      {websites.map(website => (
        <div key={website.id}>
          <h2 className="text-xl font-semibold mb-4">{website.name} ({website.domain})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {websiteActions
              .filter(action => action.websiteId === website.id)
              .map(action => {
                const Icon = action.icon
                const isLoading = loading[action.id]
                const result = results[action.id]

                return (
                  <div key={action.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 ${action.color}`} />
                        <div>
                          <h3 className="font-medium text-sm">{action.title}</h3>
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => runAction(
                        action.id,
                        action.endpoint,
                        'POST',
                        { websiteId: action.websiteId, domain: action.domain }
                      )}
                      disabled={isLoading}
                      className="w-full"
                      size="sm"
                      variant="outline"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Test Now
                        </>
                      )}
                    </Button>

                    {result && (
                      <div className={`text-xs p-2 rounded ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {result.success ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3" />
                            <span className="break-words">✓ Working</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-3 w-3" />
                            <span className="break-words">✗ {result.error || 'Failed'}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      ))}
    </div>
  )
}
