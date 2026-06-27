import { describe, it, expect } from 'vitest'
import { loginSchema, recipeSchema, ratingSchema } from '@/lib/validation'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'pass' }).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(loginSchema.safeParse({ email: 'not-an-email', password: 'pass' }).success).toBe(false)
  })

  it('rejects empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false)
  })
})

describe('recipeSchema', () => {
  const valid = {
    title: 'Helado de vainilla',
    slug: 'helado-de-vainilla',
    section: 'Clásicos',
    appliance: 'ninja-creami',
    program: 'Ice Cream',
    difficulty: 'Fácil' as const,
    calories_per_serving: null,
    source: null,
    notes: null,
    has_mixin: false,
    is_public: true,
    tags: [],
    ingredient_groups: [{ label: null, items: ['200ml leche'] }],
    steps: [{ appliance: 'ninja' as const, title: null, description: 'Procesar' }],
  }

  it('accepts a valid recipe', () => {
    expect(recipeSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects slug with spaces', () => {
    expect(recipeSchema.safeParse({ ...valid, slug: 'helado de vainilla' }).success).toBe(false)
  })

  it('rejects slug with uppercase', () => {
    expect(recipeSchema.safeParse({ ...valid, slug: 'Helado' }).success).toBe(false)
  })

  it('rejects invalid difficulty', () => {
    expect(recipeSchema.safeParse({ ...valid, difficulty: 'Muy alta' }).success).toBe(false)
  })

  it('rejects empty ingredient', () => {
    const groups = [{ label: null, items: [''] }]
    expect(recipeSchema.safeParse({ ...valid, ingredient_groups: groups }).success).toBe(false)
  })

  it('rejects group with no ingredients', () => {
    const groups = [{ label: null, items: [] }]
    expect(recipeSchema.safeParse({ ...valid, ingredient_groups: groups }).success).toBe(false)
  })

  it('rejects missing title', () => {
    expect(recipeSchema.safeParse({ ...valid, title: '' }).success).toBe(false)
  })
})

describe('ratingSchema', () => {
  const validRatings = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]
  for (const r of validRatings) {
    it(`accepts rating ${r}`, () => {
      expect(ratingSchema.safeParse({ rating: r }).success).toBe(true)
    })
  }

  it('rejects rating 0', () => {
    expect(ratingSchema.safeParse({ rating: 0 }).success).toBe(false)
  })

  it('rejects rating 5.5', () => {
    expect(ratingSchema.safeParse({ rating: 5.5 }).success).toBe(false)
  })

  it('rejects rating 3.3 (not a 0.5 step)', () => {
    expect(ratingSchema.safeParse({ rating: 3.3 }).success).toBe(false)
  })
})
