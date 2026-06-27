import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import RegisterForm from '@/components/auth/RegisterForm'

export default async function RegisterPage() {
  const session = await getSession()
  if (session.user) redirect('/recetas')

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">
            🍦 Crear cuenta
          </h1>
          <p className="text-sm text-muted-foreground">Necesitas un código de invitación</p>
        </div>

        <RegisterForm />

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  )
}
