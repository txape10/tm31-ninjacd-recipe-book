import { db } from './db'

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
  created_at: string
  updated_at: string
}

export type RecipeWithTags = Recipe & { tags: string[] }

export async function getRecipes(): Promise<RecipeWithTags[]> {
  const { rows } = await db.execute(`
    SELECT r.*,
           GROUP_CONCAT(t.name, ',') AS tags_concat
      FROM recipes r
      LEFT JOIN recipe_tags rt ON rt.recipe_id = r.id
      LEFT JOIN tags t ON t.id = rt.tag_id
     GROUP BY r.id
     ORDER BY r.section, r.title
  `)

  return rows.map((row) => ({
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
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    tags: row.tags_concat ? (row.tags_concat as string).split(',') : [],
  }))
}

export async function getRecipeBySlug(slug: string): Promise<RecipeWithTags | null> {
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return null

  const { rows } = await db.execute({
    sql: `
      SELECT r.*,
             GROUP_CONCAT(t.name, ',') AS tags_concat
        FROM recipes r
        LEFT JOIN recipe_tags rt ON rt.recipe_id = r.id
        LEFT JOIN tags t ON t.id = rt.tag_id
       WHERE r.slug = ?
       GROUP BY r.id
    `,
    args: [slug],
  })

  if (rows.length === 0) return null

  const row = rows[0]
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
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    tags: row.tags_concat ? (row.tags_concat as string).split(',') : [],
  }
}
