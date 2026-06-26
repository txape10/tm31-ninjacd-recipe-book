import { getSession } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'

export default async function RecetasLayout({ children }: LayoutProps<'/recetas'>) {
  const session = await getSession()

  return (
    <div className="flex min-h-screen">
      <Sidebar isLoggedIn={!!session.user} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
