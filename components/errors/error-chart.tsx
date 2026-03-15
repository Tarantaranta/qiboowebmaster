'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function ErrorChart({ data }: { data?: any[] }) {
  // Check if we have any actual errors (not just empty days)
  const hasErrors = data && data.length > 0 && data.some(d => d.errors > 0)

  if (!hasErrors) {
    return (
      <div className="flex items-center justify-center h-[250px] text-muted-foreground">
        <div className="text-center">
          <p className="text-lg">No errors recorded</p>
          <p className="text-sm mt-1">Error tracking is active and working</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          className="text-xs"
          stroke="hsl(var(--muted-foreground))"
        />
        <YAxis
          className="text-xs"
          stroke="hsl(var(--muted-foreground))"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        <Line
          type="monotone"
          dataKey="errors"
          stroke="hsl(var(--destructive))"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
