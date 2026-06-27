import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(_request: NextRequest, props: { params: Promise<{ code: string }> }) {
  const session = await getSession()
  if (!session.user?.isAdmin) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const { code } = await props.params

  const { rows } = await db.execute({
    sql: 'SELECT used_by, expires_at FROM invite_codes WHERE code = ?',
    args: [code.toUpperCase()],
  })

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Código no encontrado' }, { status: 404 })
  }

  if (rows[0].used_by !== null) {
    return NextResponse.json({ error: 'El código ya ha sido usado y no se puede revocar' }, { status: 409 })
  }

  const { rowsAffected } = await db.execute({
    sql: 'DELETE FROM invite_codes WHERE code = ? AND used_by IS NULL',
    args: [code.toUpperCase()],
  })

  if (rowsAffected === 0) {
    return NextResponse.json({ error: 'El código ya ha sido usado y no se puede revocar' }, { status: 409 })
  }

  return NextResponse.json({ ok: true })
}
