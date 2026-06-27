'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  recipeId: string
  recipeTitle: string
}

export default function DeleteRecipeButton({ recipeId, recipeTitle }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function openDialog() {
    setError(null)
    dialogRef.current?.showModal()
  }

  function closeDialog() {
    dialogRef.current?.close()
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/recipes/${recipeId}`, { method: 'DELETE' })
        if (!res.ok) {
          const data = await res.json() as Record<string, unknown>
          setError(typeof data.error === 'string' ? data.error : 'Error al eliminar')
          return
        }
        closeDialog()
        router.push('/recetas')
        router.refresh()
      } catch {
        setError('Error de red. Inténtalo de nuevo.')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="text-xs px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-medium hover:bg-destructive/25 transition-colors"
      >
        Eliminar
      </button>

      {/* Dialog nativo — accesible, sin dependencias */}
      <dialog
        ref={dialogRef}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-desc"
        className="rounded-xl border border-border bg-card text-foreground shadow-2xl p-6 max-w-sm w-full backdrop:bg-black/50 open:animate-in open:fade-in open:zoom-in-95"
        onClick={(e) => { if (e.target === dialogRef.current) closeDialog() }}
      >
        <h2 id="delete-dialog-title" className="font-heading text-lg font-semibold mb-2">
          ¿Eliminar receta?
        </h2>
        <p id="delete-dialog-desc" className="text-sm text-muted-foreground mb-4">
          Se borrará permanentemente <strong className="text-foreground">{recipeTitle}</strong> junto
          con sus ingredientes, pasos, valoraciones y favoritos. Esta acción no se puede deshacer.
        </p>

        {error && (
          <p role="alert" className="text-sm text-destructive mb-3">{error}</p>
        )}

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={closeDialog}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm border border-border text-foreground hover:bg-accent transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Eliminando…' : 'Sí, eliminar'}
          </button>
        </div>
      </dialog>
    </>
  )
}
