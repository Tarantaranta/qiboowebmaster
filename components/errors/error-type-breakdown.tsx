'use client'

import { Progress } from '@/components/ui/progress'

export function ErrorTypeBreakdown({ errorTypes }: { errorTypes?: any[] }) {
  if (!errorTypes || errorTypes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No error type data yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {errorTypes.map((errorType) => (
        <div key={errorType.type} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{errorType.type}</span>
            <span className="text-muted-foreground">
              {errorType.count} errors ({errorType.percentage}%)
            </span>
          </div>
          <Progress value={errorType.percentage} className="h-2" />
        </div>
      ))}
    </div>
  )
}
