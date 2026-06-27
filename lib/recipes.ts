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
  if (user?.email) {
    return {
      sql: '(r.is_public = 1 OR r.created_by = ?)',
      args: [user.email],
    }
  }
  return { sql: 'r.is_public = 1', args: [] }
}

function rowToRecipe(row: Record<string, unknown>): RecipeWithTags {
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
    created_by: row.created_by as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    tags: row.tags_concat ? (row.tags_concat as string).split(',') : [],
    avg_rating: row.avg_rating != null ? Number(row.avg_rating) : null,
    rating_count: row.rating_count != null ? Number(row.rating_count) : 0,
    user_rating: row.user_rating != null ? Number(row.user_rating) : null,
    is_favorited: (row.is_favorited as number) === 1,
  }
}

export async function getRecipes(user?: SessionUser): Promise<RecipeWithTags[]> {
  const { sql: clause, args } = buildVisibilityFilter(user)
  const userEmail = user?.email ?? null

  const { rows } = await db.execute({
    sql: `
      SELECT r.*,
             GROUP_CONCAT(DISTINCT t.name) AS tags_concat,
             AVG(rr.rating)               AS avg_rating,
             COUNT(rr.recipe_id)          AS rating_count,
             MAX(CASE WHEN rr.user_email = ? THEN rr.rating END) AS user_rating,
             MAX(CASE WHEN rf.user_email = ? THEN 1 ELSE 0 END)  AS is_favorited
        FROM recipes r
        LEFT JOIN recipe_tags rt ON rt.recipe_id = r.id
        LEFT JOIN tags t ON t.id = rt.tag_id
        LEFT JOIN recipe_ratings rr ON rr.recipe_id = r.id
        LEFT JOIN recipe_favorites rf ON rf.recipe_id = r.id AND rf.user_email = ?
       WHERE ${clause}
       GROUP BY r.id
       ORDER BY r.section, r.title
    `,
    args: [userEmail, userEmail, userEmail, ...args],
  })

  return rows.map(rowToRecipe)
}

export async function getRecipeBySlug(slug: string, user?: SessionUser): Promise<RecipeWithTags | null> {
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return null

  const { sql: clause, args } = buildVisibilityFilter(user)
  const userEmail = user?.email ?? null

  const { rows } = await db.execute({
    sql: `
      SELECT r.*,
             GROUP_CONCAT(DISTINCT t.name) AS tags_concat,
             AVG(rr.rating)               AS avg_rating,
             COUNT(rr.recipe_id)          AS rating_count,
             MAX(CASE WHEN rr.user_email = ? THEN rr.rating END) AS user_rating,
             MAX(CASE WHEN rf.user_email = ? THEN 1 ELSE 0 END)  AS is_favorited
        FROM recipes r
        LEFT JOIN recipe_tags rt ON rt.recipe_id = r.id
        LEFT JOIN tags t ON t.id = rt.tag_id
        LEFT JOIN recipe_ratings rr ON rr.recipe_id = r.id
        LEFT JOIN recipe_favorites rf ON rf.recipe_id = r.id AND rf.user_email = ?
       WHERE r.slug = ? AND ${clause}
       GROUP BY r.id
    `,
    args: [userEmail, userEmail, userEmail, slug, ...args],
  })

  if (rows.length === 0) return null
  return rowToRecipe(rows[0])
}

export async function getRecipeDetailById(id: string, user?: SessionUser): Promise<RecipeDetail | null> {
  const { sql: clause, args } = buildVisibilityFilter(user)
  const userEmail = user?.email ?? null

  const { rows } = await db.execute({
    sql: `
      SELECT r.*,
             GROUP_CONCAT(DISTINCT t.name) AS tags_concat,
             AVG(rr.rating)               AS avg_rating,
             COUNT(rr.recipe_id)          AS rating_count,
             MAX(CASE WHEN rr.user_email = ? THEN rr.rating END) AS user_rating,
             MAX(CASE WHEN rf.user_email = ? THEN 1 ELSE 0 END)  AS is_favorited
        FROM recipes r
        LEFT JOIN recipe_tags rt ON rt.recipe_id = r.id
        LEFT JOIN tags t ON t.id = rt.tag_id
        LEFT JOIN recipe_ratings rr ON rr.recipe_id = r.id
        LEFT JOIN recipe_favorites rf ON rf.recipe_id = r.id AND rf.user_email = ?
       WHERE r.id = ? AND ${clause}
       GROUP BY r.id
    `,
    args: [userEmail, userEmail, userEmail, id, ...args],
  })

  if (rows.length === 0) return null
  const base = rowToRecipe(rows[0])

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

export function canEditRecipe(recipe: Pick<Recipe, 'created_by'>, user?: SessionUser): boolean {
  if (!user) return false
  if (user.isAdmin) return true
  return recipe.created_by === user.email
}

export async function getRecipeDetail(slug: string, user?: SessionUser): Promise<RecipeDetail | null> {
  const base = await getRecipeBySlug(slug, user)
  if (!base) return null

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
      sql: `
        SELECT id, appliance, step_order, title, description
          FROM recipe_steps
         WHERE recipe_id = ?
         ORDER BY appliance, step_order
      `,
      args: [base.id],
    }),
  ])

  // Agrupar filas de ingredientes en grupos
  const groupMap = new Map<string, IngredientGroup>()
  for (const row of groupsResult.rows) {
    const gid = row.group_id as string
    if (!groupMap.has(gid)) {
      groupMap.set(gid, {
        id: gid,
        label: row.label as string | null,
        items: [],
      })
    }
    if (row.text) {
      groupMap.get(gid)!.items.push(row.text as string)
    }
  }

  const steps: RecipeStep[] = stepsResult.rows.map((row) => ({
    id: row.id as string,
    appliance: row.appliance as 'tm31' | 'ninja',
    step_order: row.step_order as number,
    title: row.title as string | null,
    description: row.description as string,
  }))

  return {
    ...base,
    ingredient_groups: [...groupMap.values()],
    steps,
  }
}
