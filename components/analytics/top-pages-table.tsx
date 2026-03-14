'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Mock data - will be replaced with real data
const topPages = [
  { page: '/about', views: 1243, uniqueVisitors: 891, avgTime: '2:34' },
  { page: '/blog/seo-tips', views: 987, uniqueVisitors: 743, avgTime: '3:12' },
  { page: '/', views: 856, uniqueVisitors: 654, avgTime: '1:45' },
  { page: '/contact', views: 654, uniqueVisitors: 521, avgTime: '1:23' },
  { page: '/services', views: 543, uniqueVisitors: 432, avgTime: '2:01' },
]

export function TopPagesTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Page</TableHead>
          <TableHead className="text-right">Views</TableHead>
          <TableHead className="text-right">Unique</TableHead>
          <TableHead className="text-right">Avg. Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {topPages.map((page) => (
          <TableRow key={page.page}>
            <TableCell className="font-mono text-sm">{page.page}</TableCell>
            <TableCell className="text-right font-medium">{page.views.toLocaleString()}</TableCell>
            <TableCell className="text-right">{page.uniqueVisitors.toLocaleString()}</TableCell>
            <TableCell className="text-right text-muted-foreground">{page.avgTime}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
