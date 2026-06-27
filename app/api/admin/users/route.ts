import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session.user?.isAdmin) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const { rows } = await db.execute(
    'SELECT id, email, nick, is_admin, created_at FROM users ORDER BY created_at ASC',
  )

  const users = rows.map((r) => ({
    id: r.id as string,
    email: r.email as string,
    nick: r.nick as string,
    isAdmin: (r.is_admin as number) === 1,
    createdAt: r.created_at as string,
  }))

  return NextResponse.json({ users })
}
