'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Globe } from 'lucide-react'

export interface Website {
  id: string
  name: string
  domain: string
}

interface WebsiteSelectorProps {
  websites: Website[]
  showAllOption?: boolean
}

export function WebsiteSelector({ websites, showAllOption = true }: WebsiteSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentWebsiteId = searchParams.get('website') || 'all'

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value === 'all') {
      params.delete('website')
    } else {
      params.set('website', value)
    }

    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={currentWebsiteId} onValueChange={handleChange}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select website" />
        </SelectTrigger>
        <SelectContent>
          {showAllOption && (
            <SelectItem value="all">All Websites</SelectItem>
          )}
          {websites.map((website) => (
            <SelectItem key={website.id} value={website.id}>
              <div className="flex flex-col">
                <span className="font-medium">{website.name}</span>
                <span className="text-xs text-muted-foreground">{website.domain}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
