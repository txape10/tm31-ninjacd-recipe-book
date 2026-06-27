'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import ThemeToggle from '@/components/ThemeToggle'

const NAV_ITEMS = [
  { href: '/recetas', label: '🍦 Recetas' },
]

type Props = {
  isLoggedIn: boolean
  isAdmin?: boolean
  nick?: string
}

export default function Sidebar({ isLoggedIn, isAdmin = false, nick }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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
    setUserMenuOpen(false)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  // Cerrar el menú al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    if (userMenuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen])

  const isRecetasActive = pathname === '/recetas' || pathname.startsWith('/recetas/')

  return (
    <aside className="flex flex-col w-64 h-screen sticky top-0 bg-sidebar border-r border-sidebar-border px-3 py-6 shrink-0 overflow-y-auto">
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
          <>
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
            <Link
              href="/admin/users"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith('/admin')
                  ? 'bg-sidebar-accent text-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              ⚙️ Admin
            </Link>
          </>
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

        {isLoggedIn && nick ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((o) => !o)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-sidebar-accent/50 transition-colors group"
            >
              <span className="w-8 h-8 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center font-semibold shrink-0 group-hover:bg-primary/30 transition-colors">
                {nick[0].toUpperCase()}
              </span>
              <span className="flex-1 text-left truncate text-foreground font-medium">{nick}</span>
              <svg
                className={`w-4 h-4 text-muted-foreground transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {userMenuOpen && (
              <div className="absolute bottom-full mb-1 left-0 right-0 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
                <Link
                  href="/perfil"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-sidebar-accent/50 transition-colors"
                >
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Perfil
                </Link>
                <div className="h-px bg-border" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </aside>
  )
}
