import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

function buildVisibilityArgs(userEmail?: string, isAdmin?: boolean): { clause: string; args: string[] } {
  if (isAdmin) return { clause: '1=1', args: [] }
  if (userEmail) return { clause: '(is_public = 1 OR created_by = ?)', args: [userEmail] }
  return { clause: 'is_public = 1', args: [] }
}

async function checkAccess(id: string, userEmail?: string, isAdmin?: boolean): Promise<boolean> {
  const { clause, args } = buildVisibilityArgs(userEmail, isAdmin)
  const { rows } = await db.execute({
    sql: `SELECT id FROM recipes WHERE id = ? AND ${clause}`,
    args: [id, ...args],
  })
  return rows.length > 0
}

export async function POST(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getSession()

  if (!session.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const hasAccess = await checkAccess(id, session.user.email, session.user.isAdmin)
  if (!hasAccess) {
    return NextResponse.json({ error: 'Receta no encontrada' }, { status: 404 })
  }

  await db.execute({
    sql: `INSERT OR IGNORE INTO recipe_favorites (recipe_id, user_email, created_at)
          VALUES (?, ?, datetime('now'))`,
    args: [id, session.user.email],
  })

  return NextResponse.json({ ok: true, is_favorited: true })
}

export async function DELETE(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getSession()

  if (!session.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const hasAccess = await checkAccess(id, session.user.email, session.user.isAdmin)
  if (!hasAccess) {
    return NextResponse.json({ error: 'Receta no encontrada' }, { status: 404 })
  }

  await db.execute({
    sql: `DELETE FROM recipe_favorites WHERE recipe_id = ? AND user_email = ?`,
    args: [id, session.user.email],
  })

  return NextResponse.json({ ok: true, is_favorited: false })
}
