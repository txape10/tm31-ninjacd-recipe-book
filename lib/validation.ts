import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email no válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

export const recipeSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  section: z.string().min(1),
  appliance: z.string().min(1),
  program: z.string().min(1),
  difficulty: z.enum(['Fácil', 'Media', 'Media-Alta', 'Alta']),
  calories_per_serving: z.number().int().positive().nullable(),
  rating: z.number().min(1).max(10).nullable(),
  source: z.string().nullable(),
  notes: z.string().nullable(),
  has_mixin: z.boolean(),
  tags: z.array(z.string()),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RecipeInput = z.infer<typeof recipeSchema>
