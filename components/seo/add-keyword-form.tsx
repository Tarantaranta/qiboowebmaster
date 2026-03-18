'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AddKeywordForm({ websiteId }: { websiteId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [searchVolume, setSearchVolume] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/seo/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website_id: websiteId,
          keyword: keyword.trim(),
          search_volume: searchVolume ? parseInt(searchVolume, 10) : null,
          difficulty: difficulty ? parseInt(difficulty, 10) : null,
        }),
      })

      if (response.ok) {
        setKeyword('')
        setSearchVolume('')
        setDifficulty('')
        setOpen(false)
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add keyword')
      }
    } catch (error) {
      alert('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Keyword
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Keyword to Track</DialogTitle>
          <DialogDescription>
            Add a keyword to monitor its Google search ranking
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="keyword">Keyword *</Label>
            <Input
              id="keyword"
              placeholder="e.g., web development services"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="searchVolume">Monthly Search Volume</Label>
              <Input
                id="searchVolume"
                type="number"
                placeholder="e.g., 5000"
                value={searchVolume}
                onChange={(e) => setSearchVolume(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty (0-100)</Label>
              <Input
                id="difficulty"
                type="number"
                min="0"
                max="100"
                placeholder="e.g., 45"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Keyword
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
