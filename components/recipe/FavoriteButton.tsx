'use client'

import { useState, useEffect } from 'react'

type Props = {
  recipeId: string
  initialFavorited: boolean
  canFavorite: boolean
}

export default function FavoriteButton({ recipeId, initialFavorited, canFavorite }: Props) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!error) return
    const timeout = setTimeout(() => setError(null), 3500)
    return () => clearTimeout(timeout)
  }, [error])

  if (!canFavorite) return null

  async function handleToggle() {
    if (loading) return
    setLoading(true)
    setError(null)
    const next = !favorited
    setFavorited(next)
    try {
      const res = await fetch(`/api/recipes/${recipeId}/favorite`, {
        method: next ? 'POST' : 'DELETE',
      })
      if (!res.ok) {
        throw new Error(res.status === 401 ? 'Sesión expirada. Inicia sesión de nuevo.' : 'No se pudo actualizar el favorito.')
      }
    } catch (err) {
      setFavorited(!next)
      setError(err instanceof Error ? err.message : 'Error al actualizar favorito.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        aria-label={favorited ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        className={[
          'text-xl leading-none transition-all',
          favorited ? 'text-red-400' : 'text-muted-foreground/40 hover:text-red-400/70',
          loading ? 'opacity-50' : '',
        ].join(' ')}
      >
        {favorited ? '♥' : '♡'}
      </button>
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          className="text-xs text-destructive text-center max-w-[120px]"
        >
          {error}
        </div>
      )}
    </div>
  )
}
