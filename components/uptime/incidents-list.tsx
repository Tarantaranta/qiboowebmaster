'use client'

import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Mock data - will be replaced with real incident data
const incidents = [
  {
    id: 1,
    website: 'drkeremal.com',
    type: 'downtime',
    message: 'Server not responding',
    duration: '12 minutes',
    status: 'resolved',
    timestamp: '2 hours ago',
  },
  {
    id: 2,
    website: 'qiboo.ai',
    type: 'slow_response',
    message: 'High response time (>2s)',
    duration: '45 minutes',
    status: 'resolved',
    timestamp: '5 hours ago',
  },
]

export function IncidentsList() {
  if (incidents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
        <p>No incidents in the last 7 days</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {incidents.map((incident) => (
        <div
          key={incident.id}
          className="flex items-start gap-4 p-4 border rounded-lg"
        >
          <div className="mt-1">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <p className="font-medium">{incident.website}</p>
              <Badge variant={incident.status === 'resolved' ? 'secondary' : 'destructive'}>
                {incident.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{incident.message}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {incident.duration}
              </span>
              <span>{incident.timestamp}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
