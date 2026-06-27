import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { recipeSchema } from '@/lib/validation'
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

  // Insertar grupos de ingredientes e ingredientes
  for (let gi = 0; gi < d.ingredient_groups.length; gi++) {
    const group = d.ingredient_groups[gi]
    const groupId = crypto.randomUUID()
    await db.execute({
      sql: `INSERT INTO ingredient_groups (id, recipe_id, label, position) VALUES (?, ?, ?, ?)`,
      args: [groupId, id, group.label, gi],
    })
    for (let ii = 0; ii < group.items.length; ii++) {
      await db.execute({
        sql: `INSERT INTO ingredients (id, group_id, text, position) VALUES (?, ?, ?, ?)`,
        args: [crypto.randomUUID(), groupId, group.items[ii], ii],
      })
    }
  }

  // Insertar pasos
  const stepsByAppliance: Record<string, typeof d.steps> = {}
  for (const step of d.steps) {
    if (!stepsByAppliance[step.appliance]) stepsByAppliance[step.appliance] = []
    stepsByAppliance[step.appliance].push(step)
  }
  for (const [appliance, steps] of Object.entries(stepsByAppliance)) {
    for (let si = 0; si < steps.length; si++) {
      const step = steps[si]
      await db.execute({
        sql: `INSERT INTO recipe_steps (id, recipe_id, appliance, step_order, title, description)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [crypto.randomUUID(), id, appliance, si + 1, step.title, step.description],
      })
    }
  }

  // Insertar tags: INSERT OR IGNORE en todos, luego leer IDs en batch
  if (d.tags.length > 0) {
    for (const tagName of d.tags) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)`,
        args: [crypto.randomUUID(), tagName],
      })
    }
    const placeholders = d.tags.map(() => '?').join(',')
    const { rows: tagRows } = await db.execute({
      sql: `SELECT id, name FROM tags WHERE name IN (${placeholders})`,
      args: d.tags,
    })
    for (const row of tagRows) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)`,
        args: [id, row.id as string],
      })
    }
  }

  return NextResponse.json({ ok: true, id, slug: d.slug }, { status: 201 })
}
