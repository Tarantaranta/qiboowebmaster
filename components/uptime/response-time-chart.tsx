'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Activity } from 'lucide-react'

interface ResponseTimeDataPoint {
  time: string
  ms: number
}

interface ResponseTimeChartProps {
  data?: ResponseTimeDataPoint[]
}

export function ResponseTimeChart({ data }: ResponseTimeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[250px] flex-col items-center justify-center text-muted-foreground">
        <Activity className="h-12 w-12 mb-2" />
        <p>No response time data available yet</p>
        <p className="text-xs mt-1">Data will appear after uptime checks are performed</p>
      </div>
    )
  }

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
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ fill: 'hsl(var(--primary))' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
