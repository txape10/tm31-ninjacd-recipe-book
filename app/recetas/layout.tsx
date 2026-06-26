import Sidebar from '@/components/layout/Sidebar'

export default function RecetasLayout({ children }: LayoutProps<'/recetas'>) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
