import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

function buildVisibilityArgs(userEmail?: string, isAdmin?: boolean): { clause: string; args: string[] } {
  if (isAdmin) return { clause: '1=1', args: [] }
  if (userEmail) return { clause: '(is_public = 1 OR created_by = ?)', args: [userEmail] }
  return { clause: 'is_public = 1', args: [] }
}

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getSession()

  if (!session.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON no válido' }, { status: 400 })
  }

  const rating = (body as Record<string, unknown>)?.rating
  if (
    typeof rating !== 'number' ||
    rating < 1 ||
    rating > 10 ||
    rating % 0.5 !== 0
  ) {
    return NextResponse.json(
      { error: 'Valoración no válida (1–10, pasos de 0.5)' },
      { status: 400 },
    )
  }

  // Verificar que el usuario tenga acceso a esta receta (respeta visibilidad)
  const { clause, args } = buildVisibilityArgs(session.user.email, session.user.isAdmin)
  const { rows } = await db.execute({
    sql: `SELECT id FROM recipes WHERE id = ? AND ${clause}`,
    args: [id, ...args],
  })
  if (!rows[0]) {
    return NextResponse.json({ error: 'Receta no encontrada' }, { status: 404 })
  }

  await db.execute({
    sql: `UPDATE recipes SET rating = ?, updated_at = datetime('now') WHERE id = ?`,
    args: [rating, id],
  })

  return NextResponse.json({ ok: true, rating })
}
