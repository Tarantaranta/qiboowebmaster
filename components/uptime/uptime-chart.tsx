'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Mock data - will be replaced with real uptime data
const data = [
  { date: 'Jan 15', uptime: 99.9 },
  { date: 'Jan 16', uptime: 100 },
  { date: 'Jan 17', uptime: 99.8 },
  { date: 'Jan 18', uptime: 100 },
  { date: 'Jan 19', uptime: 98.5 },
  { date: 'Jan 20', uptime: 100 },
  { date: 'Jan 21', uptime: 99.9 },
  { date: 'Jan 22', uptime: 100 },
  { date: 'Jan 23', uptime: 100 },
  { date: 'Jan 24', uptime: 99.7 },
]

export function UptimeChart() {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          className="text-xs"
          stroke="hsl(var(--muted-foreground))"
        />
        <YAxis
          className="text-xs"
          stroke="hsl(var(--muted-foreground))"
          domain={[95, 100]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value: number) => [`${value.toFixed(2)}%`, 'Uptime']}
        />
        <Bar dataKey="uptime" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
