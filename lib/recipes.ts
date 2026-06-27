import crypto from 'crypto'
import { db } from './db'
import type { SessionUser } from './auth'

export type IngredientGroup = {
  id: string
  label: string | null
  items: string[]
}

export type RecipeStep = {
  id: string
  appliance: 'tm31' | 'ninja'
  step_order: number
  title: string | null
  description: string
}

export type Recipe = {
  id: string
  title: string
  slug: string
  section: string
  appliance: string
  program: string
  difficulty: string
  calories_per_serving: number | null
  cover_image_url: string | null
  rating: number | null
  source: string | null
  notes: string | null
  has_mixin: number
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export type RecipeWithTags = Recipe & {
  tags: string[]
  avg_rating: number | null
  rating_count: number
  user_rating: number | null
  is_favorited: boolean
}

export type RecipeDetail = RecipeWithTags & {
  ingredient_groups: IngredientGroup[]
  steps: RecipeStep[]
}

export function buildVisibilityFilter(user: SessionUser | undefined): { sql: string; args: string[] } {
  if (user?.isAdmin) {
    return { sql: '1=1', args: [] }
  }
  if (user?.id) {
    return {
      sql: '(r.is_public = 1 OR r.user_id = ?)',
      args: [user.id],
    }
  }
  return { sql: 'r.is_public = 1', args: [] }
}

function normalizeRecipeRow(row: Record<string, unknown>): RecipeWithTags {
  return {
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    section: row.section as string,
    appliance: row.appliance as string,
    program: row.program as string,
    difficulty: row.difficulty as string,
    calories_per_serving: row.calories_per_serving as number | null,
    cover_image_url: row.cover_image_url as string | null,
    rating: row.rating as number | null,
    source: row.source as string | null,
    notes: row.notes as string | null,
    has_mixin: row.has_mixin as number,
    is_public: (row.is_public as number) === 1,
    // user_id NOT NULL garantizado por migración 009; created_by es columna legacy por compatibilidad
    created_by: (row.user_id as string | null) ?? (row.created_by as string | null) ?? '',
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    tags: row.tags_concat ? (row.tags_concat as string).split(',') : [],
    avg_rating: row.avg_rating != null ? Number(row.avg_rating) : null,
    rating_count: row.rating_count != null ? Number(row.rating_count) : 0,
    user_rating: row.user_rating != null ? Number(row.user_rating) : null,
    is_favorited: (row.is_favorited as number) === 1,
  }
}

function buildRecipeSelect(whereClause: string): string {
  return `
    SELECT r.*,
           GROUP_CONCAT(DISTINCT t.name) AS tags_concat,
           AVG(rr.rating)               AS avg_rating,
           COUNT(rr.recipe_id)          AS rating_count,
           MAX(CASE WHEN rr.user_id = ? THEN rr.rating END) AS user_rating,
           MAX(CASE WHEN rf.user_id = ? THEN 1 ELSE 0 END)  AS is_favorited
      FROM recipes r
      LEFT JOIN recipe_tags rt ON rt.recipe_id = r.id
      LEFT JOIN tags t ON t.id = rt.tag_id
      LEFT JOIN recipe_ratings rr ON rr.recipe_id = r.id
      LEFT JOIN recipe_favorites rf ON rf.recipe_id = r.id AND rf.user_id = ?
     WHERE ${whereClause}
     GROUP BY r.id
  `
}

export async function getRecipes(user?: SessionUser): Promise<RecipeWithTags[]> {
  const { sql: clause, args } = buildVisibilityFilter(user)
  const userId = user?.id ?? null

  const { rows } = await db.execute({
    sql: buildRecipeSelect(clause) + ' ORDER BY r.section, r.title',
    args: [userId, userId, userId, ...args],
  })

  return rows.map(normalizeRecipeRow)
}

export async function getRecipeBySlug(slug: string, user?: SessionUser): Promise<RecipeWithTags | null> {
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return null

  const { sql: clause, args } = buildVisibilityFilter(user)
  const userId = user?.id ?? null

  const { rows } = await db.execute({
    sql: buildRecipeSelect(`r.slug = ? AND ${clause}`),
    args: [userId, userId, userId, slug, ...args],
  })

  if (rows.length === 0) return null
  return normalizeRecipeRow(rows[0])
}

export async function getRecipeDetailById(id: string, user?: SessionUser): Promise<RecipeDetail | null> {
  const { sql: clause, args } = buildVisibilityFilter(user)
  const userId = user?.id ?? null

  const { rows } = await db.execute({
    sql: buildRecipeSelect(`r.id = ? AND ${clause}`),
    args: [userId, userId, userId, id, ...args],
  })

  if (rows.length === 0) return null
  return buildRecipeDetail(normalizeRecipeRow(rows[0]))
}

export function canEditRecipe(recipe: Pick<Recipe, 'created_by'>, user?: SessionUser): boolean {
  if (!user) return false
  if (user.isAdmin) return true
  return recipe.created_by === user.id
}

export async function getRecipeDetail(slug: string, user?: SessionUser): Promise<RecipeDetail | null> {
  const base = await getRecipeBySlug(slug, user)
  if (!base) return null
  return buildRecipeDetail(base)
}

async function buildRecipeDetail(base: RecipeWithTags): Promise<RecipeDetail> {
  const [groupsResult, stepsResult] = await Promise.all([
    db.execute({
      sql: `
        SELECT ig.id AS group_id, ig.label, ig.position,
               i.id AS item_id, i.text, i.position AS item_position
          FROM ingredient_groups ig
          LEFT JOIN ingredients i ON i.group_id = ig.id
         WHERE ig.recipe_id = ?
         ORDER BY ig.position, i.position
      `,
      args: [base.id],
    }),
    db.execute({
      sql: `SELECT id, appliance, step_order, title, description
              FROM recipe_steps WHERE recipe_id = ? ORDER BY appliance, step_order`,
      args: [base.id],
    }),
  ])

  const groupMap = new Map<string, IngredientGroup>()
  for (const row of groupsResult.rows) {
    const gid = row.group_id as string
    if (!groupMap.has(gid)) {
      groupMap.set(gid, { id: gid, label: row.label as string | null, items: [] })
    }
    if (row.text) groupMap.get(gid)!.items.push(row.text as string)
  }

  return {
    ...base,
    ingredient_groups: [...groupMap.values()],
    steps: stepsResult.rows.map((row) => ({
      id: row.id as string,
      appliance: row.appliance as 'tm31' | 'ninja',
      step_order: row.step_order as number,
      title: row.title as string | null,
      description: row.description as string,
    })),
  }
}

// ── Helpers de inserción (usados en POST y PUT de recetas) ─────────────────

type GroupInput = { label: string | null; items: string[] }
type StepInput = { appliance: 'tm31' | 'ninja'; title: string | null; description: string }

export async function insertIngredientGroups(recipeId: string, groups: GroupInput[]): Promise<void> {
  const statements: { sql: string; args: (string | number | null)[] }[] = [
    { sql: 'DELETE FROM ingredient_groups WHERE recipe_id = ?', args: [recipeId] },
  ]
  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi]
    const groupId = crypto.randomUUID()
    statements.push({
      sql: 'INSERT INTO ingredient_groups (id, recipe_id, label, position) VALUES (?, ?, ?, ?)',
      args: [groupId, recipeId, group.label, gi],
    })
    for (let ii = 0; ii < group.items.length; ii++) {
      statements.push({
        sql: 'INSERT INTO ingredients (id, group_id, text, position) VALUES (?, ?, ?, ?)',
        args: [crypto.randomUUID(), groupId, group.items[ii], ii],
      })
    }
  }
  await db.batch(statements, 'write')
}

export async function insertRecipeSteps(recipeId: string, steps: StepInput[]): Promise<void> {
  const byAppliance: Record<string, StepInput[]> = {}
  for (const step of steps) {
    if (!byAppliance[step.appliance]) byAppliance[step.appliance] = []
    byAppliance[step.appliance].push(step)
  }
  const statements: { sql: string; args: (string | number | null)[] }[] = [
    { sql: 'DELETE FROM recipe_steps WHERE recipe_id = ?', args: [recipeId] },
  ]
  for (const [appliance, appSteps] of Object.entries(byAppliance)) {
    for (let si = 0; si < appSteps.length; si++) {
      const step = appSteps[si]
      statements.push({
        sql: 'INSERT INTO recipe_steps (id, recipe_id, appliance, step_order, title, description) VALUES (?, ?, ?, ?, ?, ?)',
        args: [crypto.randomUUID(), recipeId, appliance, si + 1, step.title, step.description],
      })
    }
  }
  await db.batch(statements, 'write')
}

export async function insertRecipeTags(recipeId: string, tags: string[]): Promise<void> {
  const statements: { sql: string; args: (string | number | null)[] }[] = [
    { sql: 'DELETE FROM recipe_tags WHERE recipe_id = ?', args: [recipeId] },
  ]
  if (tags.length > 0) {
    for (const tagName of tags) {
      statements.push({
        sql: 'INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)',
        args: [crypto.randomUUID(), tagName],
      })
    }
    const placeholders = tags.map(() => '?').join(',')
    statements.push({
      sql: `INSERT OR IGNORE INTO recipe_tags (recipe_id, tag_id)
            SELECT ?, id FROM tags WHERE name IN (${placeholders})`,
      args: [recipeId, ...tags],
    })
  }
  await db.batch(statements, 'write')
}

export async function getRecipeById(id: string): Promise<{ id: string; created_by: string; updated_at: string } | null> {
  const { rows } = await db.execute({
    sql: 'SELECT id, user_id AS created_by, updated_at FROM recipes WHERE id = ?',
    args: [id],
  })
  if (!rows[0]) return null
  return {
    id: rows[0].id as string,
    created_by: rows[0].created_by as string,
    updated_at: rows[0].updated_at as string,
  }
}
