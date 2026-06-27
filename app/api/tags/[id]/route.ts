import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { tagUpdateSchema } from '@/lib/validation'

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getSession()

  if (!session.user?.isAdmin) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'JSON no válido' }, { status: 400 })
  }

  const result = tagUpdateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Datos no válidos', issues: result.error.issues }, { status: 400 })
  }
  const { name } = result.data

  const { rows } = await db.execute({ sql: 'SELECT id FROM tags WHERE id = ?', args: [id] })
  if (!rows[0]) return NextResponse.json({ error: 'Tag no encontrado' }, { status: 404 })

  try {
    await db.execute({ sql: 'UPDATE tags SET name = ? WHERE id = ?', args: [name.trim(), id] })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('UNIQUE') || msg.includes('unique')) {
      return NextResponse.json({ error: 'Ya existe un tag con ese nombre' }, { status: 409 })
    }
    throw err
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getSession()

  if (!session.user?.isAdmin) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const { rows: usageRows } = await db.execute({
    sql: 'SELECT COUNT(*) AS cnt FROM recipe_tags WHERE tag_id = ?',
    args: [id],
  })
  if (Number(usageRows[0]?.cnt) > 0) {
    return NextResponse.json({ error: 'El tag está en uso, desasígnalo primero' }, { status: 409 })
  }

  await db.execute({ sql: 'DELETE FROM tags WHERE id = ?', args: [id] })
  return NextResponse.json({ ok: true })
}
