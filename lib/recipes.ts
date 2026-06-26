import { db } from './db'
import type { SessionUser } from './auth'

export type Recipe = {
  id: string
  title: string
  slug: string
  section: string
  appliance: string
  program: string
  difficulty: string
  calories_per_serving: number | null
  rating: number | null
  source: string | null
  notes: string | null
  has_mixin: number
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export type RecipeWithTags = Recipe & { tags: string[] }

function buildVisibilityFilter(user: SessionUser | undefined): { sql: string; args: string[] } {
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
    rating: row.rating as number | null,
    source: row.source as string | null,
    notes: row.notes as string | null,
    has_mixin: row.has_mixin as number,
    is_public: (row.is_public as number) === 1,
    created_by: row.created_by as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    tags: row.tags_concat ? (row.tags_concat as string).split(',') : [],
  }
}

export async function getRecipes(user?: SessionUser): Promise<RecipeWithTags[]> {
  const { sql: clause, args } = buildVisibilityFilter(user)

  const { rows } = await db.execute({
    sql: `
      SELECT r.*,
             GROUP_CONCAT(t.name, ',') AS tags_concat
        FROM recipes r
        LEFT JOIN recipe_tags rt ON rt.recipe_id = r.id
        LEFT JOIN tags t ON t.id = rt.tag_id
       WHERE ${clause}
       GROUP BY r.id
       ORDER BY r.section, r.title
    `,
    args,
  })

  return rows.map(rowToRecipe)
}

export async function getRecipeBySlug(slug: string, user?: SessionUser): Promise<RecipeWithTags | null> {
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return null

  const { sql: clause, args } = buildVisibilityFilter(user)

  const { rows } = await db.execute({
    sql: `
      SELECT r.*,
             GROUP_CONCAT(t.name, ',') AS tags_concat
        FROM recipes r
        LEFT JOIN recipe_tags rt ON rt.recipe_id = r.id
        LEFT JOIN tags t ON t.id = rt.tag_id
       WHERE r.slug = ? AND ${clause}
       GROUP BY r.id
    `,
    args: [slug, ...args],
  })

  if (rows.length === 0) return null
  return rowToRecipe(rows[0])
}

export function canEditRecipe(recipe: Pick<Recipe, 'created_by'>, user?: SessionUser): boolean {
  if (!user) return false
  if (user.isAdmin) return true
  return recipe.created_by === user.email
}
