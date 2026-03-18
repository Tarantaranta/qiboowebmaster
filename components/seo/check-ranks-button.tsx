'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function CheckRanksButton({ websiteId }: { websiteId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCheckRanks = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/keywords/check-ranks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId,
          location: 'Turkey',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Checked ${data.results.length} keywords`)
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to check ranks')
      }
    } catch (error) {
      alert('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleCheckRanks}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4 mr-2" />
      )}
      Check Ranks
    </Button>
  )
}
