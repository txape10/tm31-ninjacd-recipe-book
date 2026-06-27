import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { ratingSchema } from '@/lib/validation'
import { buildVisibilityFilter } from '@/lib/recipes'

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

  const result = ratingSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Valoración no válida (1–5, pasos de 0.5)' }, { status: 400 })
  }
  const { rating } = result.data

  const { sql: clause, args: visArgs } = buildVisibilityFilter(session.user)
  const { rows } = await db.execute({
    sql: `SELECT r.id FROM recipes r WHERE r.id = ? AND ${clause}`,
    args: [id, ...visArgs],
  })
  if (!rows[0]) {
    return NextResponse.json({ error: 'Receta no encontrada' }, { status: 404 })
  }

  await db.execute({
    sql: `INSERT OR REPLACE INTO recipe_ratings (recipe_id, user_id, rating, created_at)
          VALUES (?, ?, ?, datetime('now'))`,
    args: [id, session.user.id, rating],
  })

  const { rows: statsRows } = await db.execute({
    sql: `SELECT AVG(rating) AS avg_rating, COUNT(*) AS rating_count
            FROM recipe_ratings WHERE recipe_id = ?`,
    args: [id],
  })

  return NextResponse.json({
    ok: true,
    rating,
    avg_rating: statsRows[0]?.avg_rating != null ? Number(statsRows[0].avg_rating) : rating,
    rating_count: Number(statsRows[0]?.rating_count ?? 1),
  })
}
