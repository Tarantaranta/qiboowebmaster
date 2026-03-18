'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Download, Loader2, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'

interface ReportBuilderProps {
  websites: Array<{ id: string; name: string; domain: string }>
}

const AVAILABLE_METRICS = [
  { id: 'traffic', label: 'Traffic & Visitors', category: 'Analytics' },
  { id: 'pageviews', label: 'Top Pages', category: 'Analytics' },
  { id: 'referrers', label: 'Top Referrers', category: 'Analytics' },
  { id: 'performance', label: 'Performance Metrics', category: 'Performance' },
  { id: 'core-web-vitals', label: 'Core Web Vitals', category: 'Performance' },
  { id: 'seo-queries', label: 'Search Console Queries', category: 'SEO' },
  { id: 'seo-pages', label: 'Search Console Pages', category: 'SEO' },
  { id: 'keywords', label: 'Keyword Rankings', category: 'SEO' },
  { id: 'uptime', label: 'Uptime Statistics', category: 'Health' },
  { id: 'errors', label: 'Error Logs', category: 'Health' },
]

export function ReportBuilder({ websites }: ReportBuilderProps) {
  const [selectedWebsite, setSelectedWebsite] = useState<string>('')
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  })
  const [loading, setLoading] = useState(false)

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metricId)
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    )
  }

  const handleGenerateReport = async (format: 'csv' | 'pdf') => {
    if (!selectedWebsite || selectedMetrics.length === 0) {
      alert('Please select a website and at least one metric')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId: selectedWebsite,
          metrics: selectedMetrics,
          dateRange: {
            from: dateRange.from.toISOString(),
            to: dateRange.to.toISOString(),
          },
          format,
        }),
      })

      if (response.ok) {
        // Download file
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `report-${format}-${Date.now()}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to generate report')
      }
    } catch (error) {
      alert('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const groupedMetrics = AVAILABLE_METRICS.reduce((acc, metric) => {
    if (!acc[metric.category]) acc[metric.category] = []
    acc[metric.category].push(metric)
    return acc
  }, {} as Record<string, typeof AVAILABLE_METRICS>)

  return (
    <div className="space-y-6">
      {/* Website Selection */}
      <div className="space-y-2">
        <Label>Select Website</Label>
        <Select value={selectedWebsite} onValueChange={setSelectedWebsite}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a website" />
          </SelectTrigger>
          <SelectContent>
            {websites.map(website => (
              <SelectItem key={website.id} value={website.id}>
                {website.name} ({website.domain})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <Label>Date Range</Label>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.from, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateRange.from}
                onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
              />
            </PopoverContent>
          </Popover>
          <span className="flex items-center">to</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.to, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateRange.to}
                onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Metrics Selection */}
      <div className="space-y-2">
        <Label>Select Metrics</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(groupedMetrics).map(([category, metrics]) => (
            <div key={category} className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">{category}</h4>
              <div className="space-y-2">
                {metrics.map(metric => (
                  <div key={metric.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={metric.id}
                      checked={selectedMetrics.includes(metric.id)}
                      onCheckedChange={() => toggleMetric(metric.id)}
                    />
                    <label
                      htmlFor={metric.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {metric.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t">
        <Button
          onClick={() => handleGenerateReport('csv')}
          disabled={loading || !selectedWebsite || selectedMetrics.length === 0}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export CSV
        </Button>
        <Button
          variant="outline"
          onClick={() => handleGenerateReport('pdf')}
          disabled={loading || !selectedWebsite || selectedMetrics.length === 0}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export PDF
        </Button>
      </div>

      {selectedMetrics.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {selectedMetrics.length} metric{selectedMetrics.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  )
}
