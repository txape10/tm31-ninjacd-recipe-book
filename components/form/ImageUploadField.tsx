'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { MAX_IMAGE_SIZE_BYTES, ALLOWED_IMAGE_TYPES } from '@/lib/constants'

type Props = {
  recipeId: string
  initialUrl: string | null
  onImageChange?: (url: string | null) => void
}

export default function ImageUploadField({ recipeId, initialUrl, onImageChange }: Props) {
  const [currentUrl, setCurrentUrl] = useState<string | null>(initialUrl)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError('La imagen no puede superar 5 MB')
      return
    }
    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setError('Solo se admiten JPEG, PNG, WebP o AVIF')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleUpload() {
    const file = inputRef.current?.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('image', file)

    try {
      const res = await fetch(`/api/recipes/${recipeId}/image`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json() as Record<string, unknown>
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Error al subir la imagen')
        return
      }
      const url = data.url as string
      setCurrentUrl(url)
      setPreview(null)
      if (inputRef.current) inputRef.current.value = ''
      onImageChange?.(url)
    } catch {
      setError('Error de red. Inténtalo de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete() {
    setUploading(true)
    setError(null)
    try {
      const res = await fetch(`/api/recipes/${recipeId}/image`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json() as Record<string, unknown>
        setError(typeof data.error === 'string' ? data.error : 'Error al eliminar la imagen')
        return
      }
      setCurrentUrl(null)
      setPreview(null)
      if (inputRef.current) inputRef.current.value = ''
      onImageChange?.(null)
    } catch {
      setError('Error de red. Inténtalo de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  const displayUrl = preview ?? currentUrl

  return (
    <div className="space-y-3">
      {/* Preview / placeholder */}
      <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/30 flex items-center justify-center border border-border">
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt="Foto de la receta"
            fill
            className="object-cover"
            unoptimized={!!preview} // preview es data URL, no pasar por next/image optimizer
          />
        ) : (
          <span className="text-5xl select-none" aria-hidden>🍦</span>
        )}
        {preview && (
          <span className="absolute top-2 right-2 text-xs bg-yellow-500 text-black rounded-full px-2 py-0.5 font-medium">
            Sin subir
          </span>
        )}
      </div>

      {/* Controles */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="cursor-pointer">
          <span className="px-3 py-1.5 rounded-lg text-sm border border-border bg-background text-foreground hover:bg-accent transition-colors">
            {currentUrl ? 'Cambiar foto' : 'Elegir foto'}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>

        {preview && (
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {uploading && (
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {uploading ? 'Subiendo…' : 'Subir foto'}
          </button>
        )}

        {currentUrl && !preview && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 border border-destructive/30 disabled:opacity-50 transition-colors"
          >
            {uploading && (
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {uploading ? 'Eliminando…' : 'Eliminar foto'}
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <p className="text-xs text-muted-foreground">JPEG, PNG, WebP o AVIF · Máx. 5 MB</p>
    </div>
  )
}
