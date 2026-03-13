'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, ChevronDown, Zap, Brain } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function SeoAnalyzeButton({ websiteId, url }: { websiteId: string; url: string }) {
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'quick' | 'deep'>('quick')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const router = useRouter()

  const handleAnalyze = async (selectedMode: 'quick' | 'deep') => {
    setLoading(true)
    setDropdownOpen(false)
    try {
      const response = await fetch('/api/seo/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          website_id: websiteId,
          url: url,
          mode: selectedMode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed')
      }

      router.refresh()
    } catch (error: any) {
      alert(error.message || 'SEO analizi yapılamadı. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative inline-flex">
      <Button
        onClick={() => handleAnalyze(mode)}
        disabled={loading}
        className="gap-2 rounded-r-none"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {mode === 'deep' ? 'Derin Analiz...' : 'Analiz Ediliyor...'}
          </>
        ) : (
          <>
            {mode === 'deep' ? <Brain className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
            {mode === 'deep' ? 'Deep Analysis' : 'Quick Analysis'}
          </>
        )}
      </Button>
      <div className="relative">
        <Button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          disabled={loading}
          variant="default"
          className="rounded-l-none border-l px-2"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>

        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-80 rounded-lg bg-white dark:bg-gray-800 shadow-xl border z-50">
              <div className="p-1">
                <button
                  onClick={() => {
                    setMode('quick')
                    setDropdownOpen(false)
                  }}
                  className="flex items-start gap-3 w-full p-3 rounded-md hover:bg-accent text-left"
                >
                  <Zap className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Quick Analysis</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      gpt-4o • ~1.35 TL • 10 saniye • Hızlı ve detaylı
                    </p>
                  </div>
                </button>
                <div className="border-t my-1" />
                <button
                  onClick={() => {
                    setMode('deep')
                    setDropdownOpen(false)
                  }}
                  className="flex items-start gap-3 w-full p-3 rounded-md hover:bg-accent text-left"
                >
                  <Brain className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm flex items-center gap-2">
                      Deep Analysis
                      <span className="text-xs bg-purple-500 text-white px-1.5 py-0.5 rounded">
                        PREMIUM
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      o1-preview • ~8 TL • 30-40 saniye • Maximum derinlik
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
