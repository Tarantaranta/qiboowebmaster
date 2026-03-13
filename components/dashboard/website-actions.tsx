'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MoreVertical, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface WebsiteActionsProps {
  websiteId: string
  websiteName: string
  domain: string
}

export function WebsiteActions({ websiteId, websiteName, domain }: WebsiteActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`"${websiteName}" websitesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/websites/${websiteId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete website')
      }

      router.refresh()
    } catch (error) {
      alert('Website silinemedi. Lütfen tekrar deneyin.')
    } finally {
      setIsDeleting(false)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8"
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 rounded-md bg-white dark:bg-gray-800 shadow-lg border z-50">
            <div className="py-1">
              <a
                href={`https://${domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent"
              >
                <ExternalLink className="h-4 w-4" />
                Siteyi Aç
              </a>
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent w-full text-left"
                onClick={() => {
                  alert('Edit özelliği yakında eklenecek!')
                  setIsOpen(false)
                }}
              >
                <Pencil className="h-4 w-4" />
                Düzenle
              </button>
              <div className="border-t my-1" />
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-destructive/10 text-destructive w-full text-left"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Siliniyor...' : 'Sil'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
