import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { recipeSchema } from '@/lib/validation'
import { insertIngredientGroups, insertRecipeSteps, insertRecipeTags } from '@/lib/recipes'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
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

  const result = recipeSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Datos no válidos', issues: result.error.issues }, { status: 400 })
  }

  const d = result.data
  const id = crypto.randomUUID()

  try {
    await db.execute({
      sql: `INSERT INTO recipes
              (id, title, slug, section, appliance, program, difficulty,
               calories_per_serving, source, notes, has_mixin, is_public,
               created_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [
        id, d.title, d.slug, d.section, d.appliance, d.program, d.difficulty,
        d.calories_per_serving, d.source, d.notes,
        d.has_mixin ? 1 : 0, d.is_public ? 1 : 0,
        session.user.email,
      ],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('UNIQUE') || msg.includes('unique')) {
      return NextResponse.json({ error: 'El slug ya existe, elige otro' }, { status: 409 })
    }
    throw err
  }

  await insertIngredientGroups(id, d.ingredient_groups)
  await insertRecipeSteps(id, d.steps)
  await insertRecipeTags(id, d.tags)

  return NextResponse.json({ ok: true, id, slug: d.slug }, { status: 201 })
}
