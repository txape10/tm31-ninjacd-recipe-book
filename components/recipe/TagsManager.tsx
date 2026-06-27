'use client'

import { useState } from 'react'

type Tag = { id: string; name: string; recipe_count: number }

type Props = { initialTags: Tag[] }

export default function TagsManager({ initialTags }: Props) {
  const [tags, setTags] = useState(initialTags)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function startEdit(tag: Tag) {
    setEditingId(tag.id)
    setEditName(tag.name)
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
    setError(null)
  }

  async function handleRename(id: string) {
    if (!editName.trim() || editName.trim() === tags.find((t) => t.id === id)?.name) {
      cancelEdit()
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/tags/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      })
      const data = await res.json() as Record<string, unknown>
      if (!res.ok) { setError(typeof data.error === 'string' ? data.error : 'Error'); return }
      setTags((prev) => prev.map((t) => t.id === id ? { ...t, name: editName.trim() } : t))
      cancelEdit()
    } catch {
      setError('Error de red')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar el tag "${name}"?`)) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/tags/${id}`, { method: 'DELETE' })
      const data = await res.json() as Record<string, unknown>
      if (!res.ok) { setError(typeof data.error === 'string' ? data.error : 'Error'); return }
      setTags((prev) => prev.filter((t) => t.id !== id))
    } catch {
      setError('Error de red')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
        {tags.length === 0 && (
          <p className="text-sm text-muted-foreground p-4">No hay tags.</p>
        )}
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center gap-3 px-4 py-3 bg-card">
            {editingId === tag.id ? (
              <>
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRename(tag.id); if (e.key === 'Escape') cancelEdit() }}
                  className="flex-1 text-sm bg-input border border-border rounded-md px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button onClick={() => handleRename(tag.id)} disabled={busy} className="text-xs text-primary font-medium disabled:opacity-50">Guardar</button>
                <button onClick={cancelEdit} disabled={busy} className="text-xs text-muted-foreground disabled:opacity-50">Cancelar</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium text-foreground">{tag.name}</span>
                <span className="text-xs text-muted-foreground">{tag.recipe_count} {tag.recipe_count === 1 ? 'receta' : 'recetas'}</span>
                <button onClick={() => startEdit(tag)} disabled={busy} className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors">Renombrar</button>
                <button
                  onClick={() => handleDelete(tag.id, tag.name)}
                  disabled={busy || tag.recipe_count > 0}
                  title={tag.recipe_count > 0 ? 'En uso — desasigna primero' : 'Eliminar'}
                  className="text-xs text-destructive hover:text-destructive/80 disabled:opacity-30 transition-colors"
                >
                  Eliminar
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
