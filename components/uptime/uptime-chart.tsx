'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { CheckCircle2 } from 'lucide-react'

interface UptimeDataPoint {
  date: string
  uptime: number
}

interface UptimeChartProps {
  data?: UptimeDataPoint[]
}

export function UptimeChart({ data }: UptimeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[250px] flex-col items-center justify-center text-muted-foreground">
        <CheckCircle2 className="h-12 w-12 mb-2 text-green-500" />
        <p>No uptime data available yet</p>
        <p className="text-xs mt-1">Data will appear after uptime checks are performed</p>
      </div>
    )
  }

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
