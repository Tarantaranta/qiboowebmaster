'use client'

import { Progress } from '@/components/ui/progress'

// Mock data - will be replaced with real data
const sources = [
  { name: 'Direct', visitors: 1234, percentage: 42 },
  { name: 'Google', visitors: 987, percentage: 34 },
  { name: 'Social Media', visitors: 456, percentage: 15 },
  { name: 'Referral', visitors: 234, percentage: 8 },
  { name: 'Email', visitors: 89, percentage: 1 },
]

export function TrafficSources() {
  return (
    <div className="space-y-4">
      {sources.map((source) => (
        <div key={source.name} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{source.name}</span>
            <span className="text-muted-foreground">
              {source.visitors.toLocaleString()} visitors ({source.percentage}%)
            </span>
          </div>
          <Progress value={source.percentage} className="h-2" />
        </div>
      ))}
    </div>
  )
}
