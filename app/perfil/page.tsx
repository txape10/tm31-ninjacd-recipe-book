import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import ChangePasswordForm from '@/components/auth/ChangePasswordForm'

export default async function PerfilPage() {
  const session = await getSession()
  if (!session.user) redirect('/login')

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-heading font-bold text-foreground">Mi perfil</h1>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <p className="text-sm text-muted-foreground">Nick</p>
          <p className="font-medium text-foreground">{session.user.nick}</p>
          <p className="text-sm text-muted-foreground mt-3">Email</p>
          <p className="font-medium text-foreground">{session.user.email}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-5">
          <h2 className="font-heading font-semibold text-foreground">Cambiar contraseña</h2>
          <ChangePasswordForm />
        </div>
      </div>
    </main>
  )
}
