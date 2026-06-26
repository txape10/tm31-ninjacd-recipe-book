import { Suspense } from 'react'
import { getSession } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'

export default async function RecetasLayout({ children }: LayoutProps<'/recetas'>) {
  const session = await getSession()
  const isLoggedIn = !!session.user

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — visible solo en desktop */}
      <div className="hidden lg:flex">
        {/* Suspense necesario porque Sidebar usa useSearchParams() */}
        <Suspense fallback={<div className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border shrink-0" />}>
          <Sidebar isLoggedIn={isLoggedIn} />
        </Suspense>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra superior mobile */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-sidebar sticky top-0 z-20">
          <Suspense fallback={<div className="w-8 h-8" />}>
            <MobileNav isLoggedIn={isLoggedIn} />
          </Suspense>
          <div>
            <span className="font-heading text-sm font-bold text-foreground">Recetario</span>
            <span className="text-xs text-muted-foreground ml-1.5">Ninja CREAMi Deluxe</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
