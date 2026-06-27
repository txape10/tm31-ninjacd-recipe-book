'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

const PROGRAMS = ['Ice Cream', 'Gelato', 'Sorbet', 'Milkshake', 'Frappé']
const DIFFICULTIES = ['Fácil', 'Media', 'Media-Alta', 'Alta']
const SECTIONS = ['Häagen-Dazs', 'Clásicos', 'Especiales', 'Sorbetes', 'Batidos']

type Props = {
  totalVisible: number
  totalAll: number
}

export default function SearchAndFilterBar({ totalVisible, totalAll }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sincronizar estado local si el usuario navega atrás/adelante
  useEffect(() => {
    setSearch(searchParams.get('search') ?? '')
  }, [searchParams])

  const pushParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value)
        else params.delete(key)
      }
      router.push(`/recetas?${params.toString()}`)
    },
    [router, searchParams],
  )

  function handleSearch(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => pushParams({ search: value }), 300)
  }

  function handleSelect(key: string, value: string) {
    pushParams({ [key]: value })
  }

  function clearAll() {
    setSearch('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('search')
    params.delete('program')
    params.delete('difficulty')
    params.delete('section')
    router.push(`/recetas?${params.toString()}`)
  }

  const program = searchParams.get('program') ?? ''
  const difficulty = searchParams.get('difficulty') ?? ''
  const section = searchParams.get('section') ?? ''
  const hasActiveFilters = !!(search || program || difficulty || section)
  const isFiltered = totalVisible < totalAll

  return (
    <div className="space-y-3">
      {/* Barra de búsqueda */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none"
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar recetas…"
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Selectores */}
      <div className="flex flex-wrap gap-2">
        <Select
          value={program}
          onChange={(v) => handleSelect('program', v)}
          placeholder="Tipo"
          options={PROGRAMS}
        />
        <Select
          value={difficulty}
          onChange={(v) => handleSelect('difficulty', v)}
          placeholder="Dificultad"
          options={DIFFICULTIES}
        />
        <Select
          value={section}
          onChange={(v) => handleSelect('section', v)}
          placeholder="Sección"
          options={SECTIONS}
        />

        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Contador */}
      {isFiltered && (
        <p className="text-xs text-muted-foreground">
          {totalVisible} de {totalAll} recetas
        </p>
      )}
    </div>
  )
}

type SelectProps = {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: string[]
}

function Select({ value, onChange, placeholder, options }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-3 py-1.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
        value
          ? 'border-primary/50 bg-primary/10 text-primary font-medium'
          : 'border-border bg-background text-foreground'
      }`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  )
}
