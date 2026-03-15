'use client'

import { Progress } from '@/components/ui/progress'

// Mock data - will be replaced with real error type data
const errorTypes = [
  { type: 'JavaScript Error', count: 45, percentage: 42 },
  { type: 'Network Error', count: 32, percentage: 30 },
  { type: 'API Error', count: 18, percentage: 17 },
  { type: 'Timeout', count: 12, percentage: 11 },
]

export function ErrorTypeBreakdown() {
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
