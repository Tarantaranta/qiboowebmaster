'use client'

import { Progress } from '@/components/ui/progress'

export function TrafficSources({ sources }: { sources?: any[] }) {
  if (!sources || sources.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No traffic source data yet</p>
      </div>
    )
  }

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
