'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'

const NAV_ITEMS = [
  { href: '/recetas', label: '🍦 Recetas' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const res = await fetch('/api/auth/logout', { method: 'POST' })
    if (!res.ok) return
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-sidebar border-r border-sidebar-border px-3 py-6 shrink-0">
      <div className="mb-8 px-2">
        <h1 className="font-heading text-xl font-bold text-foreground leading-tight">
          Recetario
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Ninja CREAMi Deluxe</p>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-sidebar-accent text-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-4 space-y-2">
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 text-left transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
