'use client'

import { useState, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import IngredientGroupEditor, { type GroupData } from './IngredientGroupEditor'
import RecipeStepsEditor, { type StepData } from './RecipeStepsEditor'

const SECTIONS = ['Häagen-Dazs', 'Clásicos', 'Especiales', 'Sorbetes', 'Batidos']
const PROGRAMS = ['Ice Cream', 'Gelato', 'Sorbet', 'Milkshake', 'Frappé', 'Light Ice Cream', 'Smoothie Bowl']
const DIFFICULTIES = ['Fácil', 'Media', 'Media-Alta', 'Alta']

export type RecipeFormData = {
  id?: string
  title: string
  slug: string
  section: string
  appliance: string
  program: string
  difficulty: string
  calories_per_serving: number | null
  source: string
  notes: string
  has_mixin: boolean
  is_public: boolean
  tags: string[]
  ingredient_groups: GroupData[]
  steps: StepData[]
}

type Props = {
  mode: 'create' | 'edit'
  initial: RecipeFormData
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export default function RecipeForm({ mode, initial }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<RecipeFormData>(initial)
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof RecipeFormData>(key: K, value: RecipeFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleTitleChange(title: string) {
    setForm(prev => ({
      ...prev,
      title,
      // Auto-slug solo en modo crear y si el slug no fue editado manualmente
      ...(mode === 'create' && prev.slug === slugify(prev.title) ? { slug: slugify(title) } : {}),
    }))
  }

  function addTag(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' && e.key !== ',') return
    e.preventDefault()
    const tag = tagInput.trim().toLowerCase()
    if (tag && !form.tags.includes(tag)) {
      set('tags', [...form.tags, tag])
    }
    setTagInput('')
  }

  function removeTag(tag: string) {
    set('tags', form.tags.filter(t => t !== tag))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    // Validaciones de cliente antes del roundtrip
    if (form.ingredient_groups.some(g => g.items.filter(Boolean).length === 0)) {
      setError('Todos los grupos de ingredientes deben tener al menos un ingrediente')
      setSaving(false)
      return
    }
    if (form.steps.filter(s => s.description.trim()).length === 0) {
      setError('Añade al menos un paso de elaboración')
      setSaving(false)
      return
    }

    const payload = {
      ...form,
      calories_per_serving: form.calories_per_serving || null,
      source: form.source || null,
      notes: form.notes || null,
      ingredient_groups: form.ingredient_groups.map(g => ({
        label: g.label || null,
        items: g.items.filter(Boolean),
      })),
      steps: form.steps.filter(s => s.description.trim()),
    }

    try {
      const url = mode === 'create' ? '/api/recipes' : `/api/recipes/${form.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json() as Record<string, unknown>
      if (!res.ok) {
        setError((data.error as string) ?? 'Error al guardar')
        return
      }

      router.push(`/recetas/${data.slug ?? form.slug}`)
      router.refresh()
    } catch {
      setError('Error de red. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {/* Datos básicos */}
      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">Datos básicos</h2>

        <div className="grid grid-cols-1 gap-4">
          <Field label="Título *">
            <input
              required
              type="text"
              value={form.title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="Ej: Häagen-Dazs Chocolate Belga"
              className={inputClass}
            />
          </Field>

          <Field label="Slug (URL) *">
            <input
              required
              type="text"
              pattern="^[a-z0-9-]+$"
              value={form.slug}
              onChange={e => set('slug', e.target.value)}
              placeholder="haagen-dazs-chocolate-belga"
              className={`${inputClass} font-mono text-sm`}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Solo minúsculas, números y guiones. URL: /recetas/{form.slug || '…'}
            </p>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Sección *">
              <select required value={form.section} onChange={e => set('section', e.target.value)} className={selectClass}>
                <option value="">Elegir…</option>
                {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>

            <Field label="Programa *">
              <select required value={form.program} onChange={e => set('program', e.target.value)} className={selectClass}>
                <option value="">Elegir…</option>
                {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Dificultad *">
              <select required value={form.difficulty} onChange={e => set('difficulty', e.target.value)} className={selectClass}>
                <option value="">Elegir…</option>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>

            <Field label="Calorías por ración">
              <input
                type="number"
                min={1}
                value={form.calories_per_serving ?? ''}
                onChange={e => set('calories_per_serving', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="ej: 280"
                className={inputClass}
              />
            </Field>
          </div>
        </div>
      </section>

      {/* Ingredientes */}
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Ingredientes</h2>
        <IngredientGroupEditor
          groups={form.ingredient_groups}
          onChange={groups => set('ingredient_groups', groups)}
        />
      </section>

      {/* Pasos */}
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Pasos de elaboración</h2>
        <RecipeStepsEditor
          steps={form.steps}
          onChange={steps => set('steps', steps)}
        />
      </section>

      {/* Tags, notas, fuente */}
      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">Detalles adicionales</h2>

        <Field label="Tags">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {form.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive leading-none">×</button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder="Escribe un tag y pulsa Enter o coma"
              className={inputClass}
            />
          </div>
        </Field>

        <Field label="Notas">
          <textarea
            value={form.notes}
            rows={3}
            onChange={e => set('notes', e.target.value)}
            placeholder="Consejos, variaciones, observaciones…"
            className={`${inputClass} resize-none`}
          />
        </Field>

        <Field label="Fuente / Referencia">
          <input
            type="text"
            value={form.source}
            onChange={e => set('source', e.target.value)}
            placeholder="URL o nombre de la fuente"
            className={inputClass}
          />
        </Field>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.has_mixin}
              onChange={e => set('has_mixin', e.target.checked)}
              className="rounded"
            />
            Lleva mix-in
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={e => set('is_public', e.target.checked)}
              className="rounded"
            />
            Receta pública
          </label>
        </div>
      </section>

      {/* Acciones */}
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-2">{error}</p>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando…' : mode === 'create' ? 'Crear receta' : 'Guardar cambios'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

const inputClass = 'w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring'
const selectClass = `${inputClass} cursor-pointer`

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  )
}
