'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface FunnelStepData {
  name: string
  visitors: number
  dropoffRate: number
  conversionRate: number
}

export function FunnelChart({ data }: { data: FunnelStepData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        <p>No funnel data available</p>
      </div>
    )
  }

  const colors = [
    'hsl(var(--primary))',
    'hsl(210, 70%, 55%)',
    'hsl(200, 60%, 50%)',
    'hsl(190, 55%, 45%)',
    'hsl(180, 50%, 40%)',
  ]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
        <XAxis type="number" stroke="hsl(var(--muted-foreground))" className="text-xs" />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          stroke="hsl(var(--muted-foreground))"
          className="text-xs"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value: number, name: string) => [value, 'Visitors']}
        />
        <Bar dataKey="visitors" radius={[0, 4, 4, 0]}>
          {data.map((_, index) => (
            <Cell key={index} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
