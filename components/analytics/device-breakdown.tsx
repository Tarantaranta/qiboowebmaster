'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

// Mock data - will be replaced with real data
const data = [
  { name: 'Desktop', value: 45, color: 'hsl(var(--primary))' },
  { name: 'Mobile', value: 38, color: 'hsl(var(--destructive))' },
  { name: 'Tablet', value: 17, color: 'hsl(var(--muted-foreground))' },
]

export function DeviceBreakdown() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
