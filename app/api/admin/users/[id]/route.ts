import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session.user?.isAdmin) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const { id } = await props.params

  if (id === session.user.id) {
    return NextResponse.json({ error: 'No puedes bloquearte a ti mismo' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 })
  }

  const { is_blocked } = body as { is_blocked?: unknown }
  if (typeof is_blocked !== 'boolean') {
    return NextResponse.json({ error: 'El campo is_blocked debe ser boolean' }, { status: 400 })
  }

  const { rowsAffected } = await db.execute({
    sql: 'UPDATE users SET is_blocked = ? WHERE id = ?',
    args: [is_blocked ? 1 : 0, id],
  })

  if (rowsAffected === 0) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
