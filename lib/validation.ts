import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email no válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

const ingredientGroupSchema = z.object({
  label: z.string().nullable(),
  items: z.array(z.string().min(1, 'El ingrediente no puede estar vacío')).min(1, 'El grupo debe tener al menos un ingrediente'),
})

const recipeStepSchema = z.object({
  appliance: z.enum(['tm31', 'ninja']),
  title: z.string().nullable(),
  description: z.string().min(1, 'La descripción del paso es obligatoria'),
})

export const recipeSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  section: z.string().min(1, 'La sección es obligatoria'),
  appliance: z.string().min(1),
  program: z.string().min(1, 'El programa es obligatorio'),
  difficulty: z.enum(['Fácil', 'Media', 'Media-Alta', 'Alta']),
  calories_per_serving: z.number().int().positive().nullable(),
  source: z.string().nullable(),
  notes: z.string().nullable(),
  has_mixin: z.boolean(),
  is_public: z.boolean(),
  tags: z.array(z.string().trim().min(1, 'El tag no puede estar vacío').max(50, 'Máximo 50 caracteres por tag')),
  ingredient_groups: z.array(ingredientGroupSchema).min(1, 'Debe haber al menos un grupo de ingredientes'),
  steps: z.array(recipeStepSchema),
})

export const ratingSchema = z.object({
  rating: z.number().min(1).max(5).refine(v => Number.isInteger(v * 2), 'Pasos de 0.5'),
})

export const tagUpdateSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(50, 'Máximo 50 caracteres'),
})

export const inviteCodeSchema = z.object({
  code: z.string().length(8, 'El código debe tener 8 caracteres'),
})

export const registerSchema = z.object({
  code: z.string().length(8, 'El código debe tener 8 caracteres'),
  email: z.string().email('Email no válido'),
  nick: z
    .string()
    .min(3, 'El nick debe tener al menos 3 caracteres')
    .max(20, 'El nick no puede superar 20 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guion bajo'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Introduce tu contraseña actual'),
  newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export type LoginInput = z.infer<typeof loginSchema>
export type RecipeInput = z.infer<typeof recipeSchema>
export type RatingInput = z.infer<typeof ratingSchema>
export type TagUpdateInput = z.infer<typeof tagUpdateSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
