import { describe, it, expect } from 'vitest'
import { applyRecipeFilters } from '@/lib/filters'
import type { RecipeWithTags } from '@/lib/recipes'

function makeRecipe(overrides: Partial<RecipeWithTags> = {}): RecipeWithTags {
  return {
    id: 'r1',
    title: 'Helado de vainilla',
    slug: 'helado-de-vainilla',
    section: 'Clásicos',
    appliance: 'ninja-creami',
    program: 'Ice Cream',
    difficulty: 'Fácil',
    calories_per_serving: null,
    cover_image_url: null,
    rating: null,
    source: null,
    notes: null,
    has_mixin: 0,
    is_public: true,
    created_by: 'admin@test.com',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    tags: [],
    avg_rating: null,
    rating_count: 0,
    user_rating: null,
    is_favorited: false,
    ...overrides,
  }
}

const recipes: RecipeWithTags[] = [
  makeRecipe({ id: 'r1', title: 'Helado de vainilla', program: 'Ice Cream', difficulty: 'Fácil', section: 'Clásicos', created_by: 'admin@test.com', is_favorited: true }),
  makeRecipe({ id: 'r2', title: 'Gelato de fresa', program: 'Gelato', difficulty: 'Media', section: 'Especiales', slug: 'gelato-fresa', created_by: 'user@test.com', is_favorited: false }),
  makeRecipe({ id: 'r3', title: 'Sorbete de limón', program: 'Sorbet', difficulty: 'Alta', section: 'Sorbetes', slug: 'sorbete-limon', created_by: 'user@test.com', is_favorited: false }),
]

describe('applyRecipeFilters', () => {
  it('returns all recipes when no filters', () => {
    expect(applyRecipeFilters(recipes, {})).toHaveLength(3)
  })

  it('filters by title search (case-insensitive)', () => {
    const result = applyRecipeFilters(recipes, { search: 'gelato' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('r2')
  })

  it('filters by program', () => {
    const result = applyRecipeFilters(recipes, { program: 'Sorbet' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('r3')
  })

  it('filters by difficulty', () => {
    const result = applyRecipeFilters(recipes, { difficulty: 'Media' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('r2')
  })

  it('filters by section', () => {
    const result = applyRecipeFilters(recipes, { section: 'Clásicos' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('r1')
  })

  it('shows only own recipes with showMine', () => {
    const result = applyRecipeFilters(recipes, { showMine: true }, 'user@test.com')
    expect(result).toHaveLength(2)
    expect(result.every((r) => r.created_by === 'user@test.com')).toBe(true)
  })

  it('shows only favorited recipes with showFavorites', () => {
    const result = applyRecipeFilters(recipes, { showFavorites: true })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('r1')
  })

  it('combines multiple filters', () => {
    const result = applyRecipeFilters(recipes, { search: 'gelato', program: 'Gelato' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('r2')
  })

  it('returns empty array when no match', () => {
    expect(applyRecipeFilters(recipes, { search: 'churros' })).toHaveLength(0)
  })
})
