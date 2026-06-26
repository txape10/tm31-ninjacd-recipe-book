'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import ThemeToggle from '@/components/ThemeToggle'

type Props = {
  isLoggedIn: boolean
}

export default function MobileNav({ isLoggedIn }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const showMine = searchParams.get('showMine') === '1'
  const showFavorites = searchParams.get('showFavorites') === '1'
  const isRecetasActive = pathname === '/recetas' || pathname.startsWith('/recetas/')

  function toggleFilter(key: 'showMine' | 'showFavorites') {
    const params = new URLSearchParams(searchParams.toString())
    if (params.get(key) === '1') {
      params.delete(key)
    } else {
      params.set(key, '1')
    }
    router.push(`/recetas?${params.toString()}`)
    setOpen(false)
  }

  async function handleLogout() {
    setOpen(false)
    const res = await fetch('/api/auth/logout', { method: 'POST' })
    if (!res.ok) return
    router.push('/login')
    router.refresh()
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Abrir menú"
        className="p-2 rounded-lg text-foreground hover:bg-accent transition-colors"
      >
        {/* Icono hamburguesa */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="3" y1="5" x2="17" y2="5" />
          <line x1="3" y1="10" x2="17" y2="10" />
          <line x1="3" y1="15" x2="17" y2="15" />
        </svg>
      </SheetTrigger>

      <SheetContent side="left" className="w-64 bg-sidebar border-r border-sidebar-border p-0 flex flex-col">
        <SheetHeader className="px-5 py-6 border-b border-sidebar-border">
          <SheetTitle className="font-heading text-xl font-bold text-foreground text-left">
            Recetario
          </SheetTitle>
          <p className="text-xs text-muted-foreground text-left">Ninja CREAMi Deluxe</p>
        </SheetHeader>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <Link
            href="/recetas"
            onClick={() => setOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/recetas' || pathname.startsWith('/recetas/')
                ? 'bg-sidebar-accent text-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
            }`}
          >
            🍦 Recetas
          </Link>

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

          {isLoggedIn && (
            <Link
              href="/recetas/nueva"
              onClick={() => setOpen(false)}
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

        <div className="px-3 pb-6 pt-2 border-t border-sidebar-border space-y-2">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 text-left transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
