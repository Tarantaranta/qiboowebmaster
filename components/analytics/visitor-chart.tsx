'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Mock data - will be replaced with real data
const data = [
  { date: 'Mon', visitors: 45, pageviews: 120 },
  { date: 'Tue', visitors: 52, pageviews: 145 },
  { date: 'Wed', visitors: 38, pageviews: 98 },
  { date: 'Thu', visitors: 67, pageviews: 187 },
  { date: 'Fri', visitors: 73, pageviews: 210 },
  { date: 'Sat', visitors: 41, pageviews: 115 },
  { date: 'Sun', visitors: 35, pageviews: 92 },
]

export function VisitorChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
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
          dataKey="visitors"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          name="Visitors"
        />
        <Line
          type="monotone"
          dataKey="pageviews"
          stroke="hsl(var(--destructive))"
          strokeWidth={2}
          name="Pageviews"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
