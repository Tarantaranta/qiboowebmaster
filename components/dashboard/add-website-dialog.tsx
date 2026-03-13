'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AddWebsiteDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    description: '',
    vercel_project_id: '',
    ga_property_id: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/websites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add website')
      }

      // Reset form and close dialog
      setFormData({
        name: '',
        domain: '',
        description: '',
        vercel_project_id: '',
        ga_property_id: ''
      })
      setIsOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} size="lg" className="gap-2">
        <Plus className="h-4 w-4" />
        Yeni Website Ekle
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">Yeni Website Ekle</CardTitle>
              <CardDescription className="mt-2">
                İzlemek istediğiniz websiteyi ekleyin. SEO analizi, uptime monitoring ve daha fazlası otomatik başlayacak.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Website Adı <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Örn: Dr. Kerem Al"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            {/* Domain */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Domain <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="example.com (http/https olmadan)"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Sadece domain adını girin, http:// veya https:// eklemeyin
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Açıklama</label>
              <Input
                placeholder="Bu website hakkında kısa açıklama"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={loading}
              />
            </div>

            {/* Advanced Settings */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium text-sm">Gelişmiş Ayarlar (Opsiyonel)</h4>

              {/* Vercel Project ID */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Vercel Project ID</label>
                <Input
                  placeholder="prj_..."
                  value={formData.vercel_project_id}
                  onChange={(e) => setFormData({ ...formData, vercel_project_id: e.target.value })}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Vercel deployment tracking için (daha sonra ekleyebilirsiniz)
                </p>
              </div>

              {/* GA Property ID */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Google Analytics Property ID</label>
                <Input
                  placeholder="properties/123456789"
                  value={formData.ga_property_id}
                  onChange={(e) => setFormData({ ...formData, ga_property_id: e.target.value })}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  GA4 entegrasyonu için (daha sonra ekleyebilirsiniz)
                </p>
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={loading}
                className="flex-1"
              >
                İptal
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ekleniyor...
                  </>
                ) : (
                  'Website Ekle'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
