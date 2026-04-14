'use client'

import * as React from 'react'
import { CalendarIcon } from 'lucide-react'
import { addDays, format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { useRouter, useSearchParams } from 'next/navigation'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DateRangePickerProps {
  className?: string
}

export function DateRangePicker({ className }: DateRangePickerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get date range from URL or default to last 7 days
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const preset = searchParams.get('range') || '7d'

  const [date, setDate] = React.useState<DateRange | undefined>(() => {
    if (from && to) {
      return {
        from: new Date(from),
        to: new Date(to),
      }
    }
    return {
      from: addDays(new Date(), -7),
      to: new Date(),
    }
  })

  const handlePresetChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', value)

    let newFrom: Date
    let newTo = new Date()

    switch (value) {
      case '7d':
        newFrom = addDays(newTo, -7)
        break
      case '30d':
        newFrom = addDays(newTo, -30)
        break
      case '90d':
        newFrom = addDays(newTo, -90)
        break
      case 'custom':
        // Don't update dates for custom, user will pick
        router.push(`?${params.toString()}`)
        return
      default:
        newFrom = addDays(newTo, -7)
    }

    setDate({ from: newFrom, to: newTo })
    params.set('from', format(newFrom, 'yyyy-MM-dd'))
    params.set('to', format(newTo, 'yyyy-MM-dd'))
    router.push(`?${params.toString()}`)
  }

  const handleDateSelect = (selectedDate: DateRange | undefined) => {
    setDate(selectedDate)

    if (selectedDate?.from && selectedDate?.to) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('range', 'custom')
      params.set('from', format(selectedDate.from, 'yyyy-MM-dd'))
      params.set('to', format(selectedDate.to, 'yyyy-MM-dd'))
      router.push(`?${params.toString()}`)
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="90d">Last 90 days</SelectItem>
          <SelectItem value="custom">Custom range</SelectItem>
        </SelectContent>
      </Select>

      {preset === 'custom' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'justify-start text-left font-normal',
                !date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, 'LLL dd, y')} -{' '}
                    {format(date.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(date.from, 'LLL dd, y')
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleDateSelect}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
