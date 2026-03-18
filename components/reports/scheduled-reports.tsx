'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Mail, Clock } from 'lucide-react'

export function ScheduledReports() {
  const scheduledReports = [
    {
      id: 1,
      name: 'Weekly Summary Report',
      schedule: 'Every Monday at 9:00 AM',
      recipients: ['admin@example.com'],
      format: 'Email',
      status: 'active',
      lastSent: '2025-03-17 09:00',
    },
  ]

  return (
    <div className="space-y-4">
      {scheduledReports.length > 0 ? (
        scheduledReports.map(report => (
          <div
            key={report.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h4 className="font-medium">{report.name}</h4>
                <Badge variant={report.status === 'active' ? 'default' : 'secondary'}>
                  {report.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {report.schedule}
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {report.recipients.length} recipient(s)
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last sent: {report.lastSent}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Edit
              </Button>
              <Button variant="ghost" size="sm">
                Pause
              </Button>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p className="mb-4">No scheduled reports yet</p>
          <Button>Create Schedule</Button>
        </div>
      )}
    </div>
  )
}
