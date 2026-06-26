'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Evita hydration mismatch
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const options = [
    { value: 'system', label: 'Auto', icon: '💻' },
    { value: 'light', label: 'Claro', icon: '☀️' },
    { value: 'dark', label: 'Oscuro', icon: '🌙' },
  ]

  return (
    <div className="flex rounded-lg border border-border overflow-hidden text-xs">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          title={opt.label}
          className={`flex-1 py-1.5 transition-colors ${
            theme === opt.value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50'
          }`}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  )
}
