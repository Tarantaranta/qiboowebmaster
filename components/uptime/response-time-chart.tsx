'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Mock data - will be replaced with real response time data
const data = [
  { time: '00:00', ms: 234 },
  { time: '04:00', ms: 189 },
  { time: '08:00', ms: 267 },
  { time: '12:00', ms: 312 },
  { time: '16:00', ms: 289 },
  { time: '20:00', ms: 245 },
]

export function ResponseTimeChart() {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="time"
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
          formatter={(value: number) => [`${value}ms`, 'Response Time']}
        />
        <Line
          type="monotone"
          dataKey="ms"
          stroke="hsl(var(--destructive))"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
