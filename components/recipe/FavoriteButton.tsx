'use client'

import { useState } from 'react'

type Props = {
  recipeId: string
  initialFavorited: boolean
  canFavorite: boolean
}

export default function FavoriteButton({ recipeId, initialFavorited, canFavorite }: Props) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)

  if (!canFavorite) return null

  async function handleToggle() {
    if (loading) return
    setLoading(true)
    const next = !favorited
    setFavorited(next) // optimistic
    try {
      const res = await fetch(`/api/recipes/${recipeId}/favorite`, {
        method: next ? 'POST' : 'DELETE',
      })
      if (!res.ok) throw new Error()
    } catch {
      setFavorited(!next) // revert
    } finally {
      setLoading(false)
    }
  }

  return (
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
  )
}
