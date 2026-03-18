'use client'

import { ArrowRight } from 'lucide-react'

interface UserFlowPath {
  path: string[]
  count: number
}

export function UserFlowTable({ paths }: { paths: UserFlowPath[] }) {
  if (!paths || paths.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        <p>No flow data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {paths.map((flow, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
            {flow.path.map((page, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded truncate max-w-[180px]" title={page}>
                  {page}
                </span>
                {i < flow.path.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                )}
              </span>
            ))}
          </div>
          <span className="text-sm font-semibold ml-4 flex-shrink-0">
            {flow.count} session{flow.count !== 1 ? 's' : ''}
          </span>
        </div>
      ))}
    </div>
  )
}
