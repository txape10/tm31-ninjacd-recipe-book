'use client'

import { useState } from 'react'

type Props = {
  recipeId: string
  initialRating: number | null
  canRate: boolean
}

export default function StarRating({ recipeId, initialRating, canRate }: Props) {
  const [rating, setRating] = useState<number | null>(initialRating)
  const [hover, setHover] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayed = hover ?? rating

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
      const data = await res.json() as unknown
      const saved = (data as Record<string, unknown>)?.rating
      if (typeof saved !== 'number') throw new Error('Respuesta inválida')
      setRating(saved)
    } catch {
      setError('No se pudo guardar la valoración')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-1">
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={() => setHover(null)}
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => {
          const filled = displayed !== null && star <= displayed
          return (
            <button
              key={star}
              type="button"
              disabled={!canRate || saving}
              onClick={() => handleClick(star)}
              onMouseEnter={() => canRate && setHover(star)}
              className={[
                'text-xl leading-none transition-colors',
                filled ? 'text-yellow-400' : 'text-muted-foreground/30',
                canRate && !saving
                  ? 'cursor-pointer hover:scale-110 transition-transform'
                  : 'cursor-default',
              ].join(' ')}
              aria-label={`Valorar ${star} de 10`}
            >
              ★
            </button>
          )
        })}
        {displayed !== null && (
          <span className="ml-2 text-sm font-mono text-muted-foreground">
            {displayed.toFixed(1)} / 10
          </span>
        )}
        {displayed === null && canRate && (
          <span className="ml-2 text-xs text-muted-foreground">Sin valorar</span>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {!canRate && rating === null && (
        <p className="text-xs text-muted-foreground">Sin valorar</p>
      )}
    </div>
  )
}
