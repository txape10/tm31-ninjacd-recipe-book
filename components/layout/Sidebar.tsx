'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'

const NAV_ITEMS = [
  { href: '/recetas', label: '🍦 Recetas' },
]

type Props = {
  isLoggedIn: boolean
  isAdmin?: boolean
}

export default function Sidebar({ isLoggedIn, isAdmin = false }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const showMine = searchParams.get('showMine') === '1'
  const showFavorites = searchParams.get('showFavorites') === '1'

  function toggleFilter(key: 'showMine' | 'showFavorites') {
    const params = new URLSearchParams(searchParams.toString())
    if (params.get(key) === '1') {
      params.delete(key)
    } else {
      params.set(key, '1')
    }
    router.push(`/recetas?${params.toString()}`)
  }

  async function handleLogout() {
    const res = await fetch('/api/auth/logout', { method: 'POST' })
    if (!res.ok) return
    router.push('/login')
    router.refresh()
  }

  const isRecetasActive = pathname === '/recetas' || pathname.startsWith('/recetas/')

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

        {/* Filtros — solo en la sección de recetas y si está logueado */}
        {isLoggedIn && isRecetasActive && (
          <div className="pt-2 pb-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Filtrar
            </p>
            <button
              onClick={() => toggleFilter('showMine')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                showMine
                  ? 'bg-primary/15 text-primary font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              📌 Mis recetas
            </button>
            <button
              onClick={() => toggleFilter('showFavorites')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                showFavorites
                  ? 'bg-primary/15 text-primary font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              ❤️ Favoritos
            </button>
          </div>
        )}

        {isLoggedIn && isAdmin && (
          <Link
            href="/recetas/tags"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/recetas/tags'
                ? 'bg-sidebar-accent text-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
            }`}
          >
            🏷️ Gestionar tags
          </Link>
        )}

        {isLoggedIn && (
          <Link
            href="/recetas/nueva"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/recetas/nueva'
                ? 'bg-sidebar-accent text-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
            }`}
          >
            + Nueva receta
          </Link>
        )}
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
