export const PROGRAMS = ['Ice Cream', 'Gelato', 'Sorbet', 'Milkshake', 'Frappé', 'Light Ice Cream', 'Smoothie Bowl'] as const
export const DIFFICULTIES = ['Fácil', 'Media', 'Media-Alta', 'Alta'] as const
export const SECTIONS = ['Häagen-Dazs', 'Clásicos', 'Especiales', 'Sorbetes', 'Batidos'] as const

export const STEP_APPLIANCES = ['tm31', 'ninja'] as const

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const

export function isValidImageUrl(url: string | null | undefined): url is string {
  if (!url) return false
  return url.startsWith('https://') || url.startsWith('/')
}
