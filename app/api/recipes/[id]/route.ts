import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { canEditRecipe } from '@/lib/recipes'
import { recipeSchema } from '@/lib/validation'

async function getRecipeById(id: string): Promise<{ id: string; created_by: string } | null> {
  const { rows } = await db.execute({
    sql: 'SELECT id, created_by FROM recipes WHERE id = ?',
    args: [id],
  })
  if (!rows[0]) return null
  return { id: rows[0].id as string, created_by: rows[0].created_by as string }
}

export async function PUT(request: NextRequest, props: RouteContext<'/api/recipes/[id]'>) {
  const { id } = await props.params
  const session = await getSession()

  if (!session.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const recipe = await getRecipeById(id)
  if (!recipe) {
    return NextResponse.json({ error: 'Receta no encontrada' }, { status: 404 })
  }

  if (!canEditRecipe(recipe, session.user)) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON no válido' }, { status: 400 })
  }

  const result = recipeSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Datos no válidos', issues: result.error.issues }, { status: 400 })
  }

  const d = result.data
  await db.execute({
    sql: `UPDATE recipes
             SET title = ?, slug = ?, section = ?, appliance = ?, program = ?,
                 difficulty = ?, calories_per_serving = ?, rating = ?,
                 source = ?, notes = ?, has_mixin = ?, is_public = ?,
                 updated_at = datetime('now')
           WHERE id = ?`,
    args: [
      d.title, d.slug, d.section, d.appliance, d.program,
      d.difficulty, d.calories_per_serving, d.rating,
      d.source, d.notes, d.has_mixin ? 1 : 0, d.is_public ? 1 : 0,
      id,
    ],
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: NextRequest, props: RouteContext<'/api/recipes/[id]'>) {
  const { id } = await props.params
  const session = await getSession()

  if (!session.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const recipe = await getRecipeById(id)
  if (!recipe) {
    return NextResponse.json({ error: 'Receta no encontrada' }, { status: 404 })
  }

  if (!canEditRecipe(recipe, session.user)) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  await db.execute({ sql: 'DELETE FROM recipes WHERE id = ?', args: [id] })

  return NextResponse.json({ ok: true })
}
