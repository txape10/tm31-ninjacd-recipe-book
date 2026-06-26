'use client'

import { useState } from 'react'

type Props = {
  recipeId: string
  avgRating: number | null
  ratingCount: number
  userRating: number | null
  canRate: boolean
}

export default function StarRating({ recipeId, avgRating, ratingCount, userRating, canRate }: Props) {
  const [avg, setAvg] = useState<number | null>(avgRating)
  const [count, setCount] = useState(ratingCount)
  const [myRating, setMyRating] = useState<number | null>(userRating)
  const [hover, setHover] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayStars = hover ?? myRating

  async function handleClick(value: number) {
    if (!canRate || saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/recipes/${recipeId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: value }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      const data = await res.json() as Record<string, unknown>
      if (typeof data.rating !== 'number') throw new Error('Respuesta inválida')
      setMyRating(data.rating as number)
      if (typeof data.avg_rating === 'number') setAvg(data.avg_rating)
      if (typeof data.rating_count === 'number') setCount(data.rating_count)
    } catch {
      setError('No se pudo guardar la valoración')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        {/* Estrellas interactivas (usuario) */}
        <div
          className="flex items-center gap-0.5"
          onMouseLeave={() => setHover(null)}
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = displayStars !== null && star <= displayStars
            return (
              <button
                key={star}
                type="button"
                disabled={!canRate || saving}
                onClick={() => handleClick(star)}
                onMouseEnter={() => canRate && setHover(star)}
                className={[
                  'text-xl leading-none transition-all',
                  filled ? 'text-yellow-400' : 'text-muted-foreground/30',
                  canRate && !saving ? 'cursor-pointer hover:scale-110' : 'cursor-default',
                ].join(' ')}
                aria-label={`Valorar ${star} de 5`}
              >
                ★
              </button>
            )
          })}
        </div>

        {/* Media global */}
        {avg !== null ? (
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{avg.toFixed(1)}</span>
            {' '}
            <span className="text-yellow-400">★</span>
            {' '}
            <span>({count} {count === 1 ? 'voto' : 'votos'})</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Sin valorar aún</span>
        )}
      </div>

      {myRating && !hover && (
        <p className="text-xs text-muted-foreground">Tu valoración: {myRating} ★</p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
