'use client'

import { formatDistanceToNow } from 'date-fns'
import { AlertTriangle, XCircle, CheckCircle2, ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

export function ErrorsList({ errors }: { errors: any[] }) {
  if (errors.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
        <p className="text-lg">No errors found</p>
        <p className="text-sm mt-1">All systems are running smoothly</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {errors.map((error) => (
        <ErrorItem key={error.id} error={error} />
      ))}
    </div>
  )
}

function ErrorItem({ error }: { error: any }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex items-start gap-4 p-4 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="mt-1">
          {error.is_resolved ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="font-medium">{error.error_message}</p>
              <p className="text-sm text-muted-foreground font-mono">
                {error.page_url}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={error.error_type === 'critical' ? 'destructive' : 'secondary'}>
                {error.error_type || 'error'}
              </Badge>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(error.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      {expanded && error.stack_trace && (
        <div className="px-4 pb-4 pt-2 bg-muted/30 border-t">
          <p className="text-xs font-medium mb-2">Stack Trace:</p>
          <pre className="text-xs bg-black/5 dark:bg-white/5 p-3 rounded overflow-x-auto">
            {error.stack_trace}
          </pre>
        </div>
      )}
    </div>
  )
}
