'use client'

import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

interface Incident {
  id: string
  website_name: string
  website_domain: string
  started_at: string
  resolved_at?: string | null
  duration_minutes?: number
  error_message?: string
}

interface IncidentsListProps {
  incidents?: Incident[]
}

export function IncidentsList({ incidents }: IncidentsListProps) {
  if (!incidents || incidents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
        <p>No incidents in the last 30 days</p>
        <p className="text-xs mt-1">All systems operating normally</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {incidents.map((incident) => {
        const isResolved = !!incident.resolved_at
        const duration = incident.duration_minutes
          ? `${incident.duration_minutes} minutes`
          : 'Ongoing'

        return (
          <div
            key={incident.id}
            className="flex items-start gap-4 p-4 border rounded-lg"
          >
            <div className="mt-1">
              <AlertTriangle className={`h-5 w-5 ${isResolved ? 'text-yellow-500' : 'text-red-500'}`} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{incident.website_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{incident.website_domain}</p>
                </div>
                <Badge variant={isResolved ? 'secondary' : 'destructive'}>
                  {isResolved ? 'Resolved' : 'Active'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {incident.error_message || 'Server not responding'}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {duration}
                </span>
                <span>
                  {formatDistanceToNow(new Date(incident.started_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
