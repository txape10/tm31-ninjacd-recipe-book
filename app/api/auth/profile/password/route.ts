import { NextRequest, NextResponse } from 'next/server'
import { getSession, checkPasswordVersion } from '@/lib/auth'
import { db } from '@/lib/db'
import { changePasswordSchema } from '@/lib/validation'
import { verifyPassword, hashPassword, validatePasswordStrength } from '@/lib/password'

export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // Verificar que la sesión no está desactualizada
  const versionOk = await checkPasswordVersion(session.user.id, session.user.passwordVersion)
  if (!versionOk) {
    await session.destroy()
    return NextResponse.json({ error: 'Sesión expirada. Por favor, inicia sesión de nuevo.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 })
  }

  const parsed = changePasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos no válidos', issues: parsed.error.issues }, { status: 400 })
  }

  const { currentPassword, newPassword } = parsed.data

  // Obtener hash actual para verificar contraseña actual
  const { rows } = await db.execute({
    sql: 'SELECT password_hash FROM users WHERE id = ?',
    args: [session.user.id],
  })
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  const currentOk = await verifyPassword(currentPassword, rows[0].password_hash as string)
  if (!currentOk) {
    return NextResponse.json({ error: 'La contraseña actual no es correcta' }, { status: 400 })
  }

  const { score, errors: pwErrors } = validatePasswordStrength(newPassword)
  if (score < 4) {
    return NextResponse.json({ error: pwErrors.join('. ') }, { status: 400 })
  }

  const newHash = await hashPassword(newPassword)

  await db.execute({
    sql: 'UPDATE users SET password_hash = ?, password_version = password_version + 1 WHERE id = ?',
    args: [newHash, session.user.id],
  })

  // Destruir sesión actual — el cliente redirigirá al login
  await session.destroy()

  return NextResponse.json({ ok: true })
}
