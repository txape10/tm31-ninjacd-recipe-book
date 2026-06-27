import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { canEditRecipe, getRecipeById, insertIngredientGroups, insertRecipeSteps, insertRecipeTags } from '@/lib/recipes'
import { recipeSchema } from '@/lib/validation'

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
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

  // Verificar que el slug no lo use otra receta
  const { rows: slugCheck } = await db.execute({
    sql: 'SELECT id FROM recipes WHERE slug = ? AND id != ?',
    args: [d.slug, id],
  })
  if (slugCheck.length > 0) {
    return NextResponse.json({ error: 'El slug ya existe, elige otro' }, { status: 409 })
  }

  const { rowsAffected } = await db.execute({
    sql: `UPDATE recipes
             SET title = ?, slug = ?, section = ?, appliance = ?, program = ?,
                 difficulty = ?, calories_per_serving = ?,
                 source = ?, notes = ?, has_mixin = ?, is_public = ?,
                 updated_at = datetime('now')
           WHERE id = ? AND updated_at = ?`,
    args: [
      d.title, d.slug, d.section, d.appliance, d.program,
      d.difficulty, d.calories_per_serving,
      d.source, d.notes, d.has_mixin ? 1 : 0, d.is_public ? 1 : 0,
      id, recipe.updated_at,
    ],
  })

  if (rowsAffected === 0) {
    return NextResponse.json(
      { error: 'La receta fue modificada por otra sesión. Recarga la página antes de guardar.' },
      { status: 409 },
    )
  }

  await insertIngredientGroups(id, d.ingredient_groups)
  await insertRecipeSteps(id, d.steps)
  await insertRecipeTags(id, d.tags)

  return NextResponse.json({ ok: true, slug: d.slug })
}

export async function DELETE(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
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
