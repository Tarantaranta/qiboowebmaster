'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function TopPagesTable({ pages }: { pages?: any[] }) {
  if (!pages || pages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No page data yet</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Page</TableHead>
          <TableHead className="text-right">Views</TableHead>
          <TableHead className="text-right">Unique Visitors</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pages.map((page, idx) => (
          <TableRow key={idx}>
            <TableCell className="font-mono text-sm">{page.page}</TableCell>
            <TableCell className="text-right font-medium">{page.views.toLocaleString()}</TableCell>
            <TableCell className="text-right">{page.uniqueVisitors.toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
