'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Mock data - will be replaced with real error data
const data = [
  { date: 'Mon', errors: 3 },
  { date: 'Tue', errors: 7 },
  { date: 'Wed', errors: 2 },
  { date: 'Thu', errors: 5 },
  { date: 'Fri', errors: 1 },
  { date: 'Sat', errors: 4 },
  { date: 'Sun', errors: 2 },
]

export function ErrorChart() {
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
