import type { RecipeWithTags } from '@/lib/recipes'

export type RecipeFilters = {
  search?: string
  program?: string
  difficulty?: string
  section?: string
  showMine?: boolean
  showFavorites?: boolean
}

export function applyRecipeFilters(
  recipes: RecipeWithTags[],
  filters: RecipeFilters,
  userEmail?: string,
): RecipeWithTags[] {
  return recipes.filter((r) => {
    if (filters.showMine && (!userEmail || r.created_by !== userEmail)) return false
    if (filters.showFavorites && !r.is_favorited) return false
    if (filters.search) {
      const normalize = (s: string) =>
        s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
      const q = normalize(filters.search)
      const matchesTitle = normalize(r.title).includes(q)
      const matchesNotes = r.notes ? normalize(r.notes).includes(q) : false
      const matchesSource = r.source ? normalize(r.source).includes(q) : false
      const matchesTags = r.tags.some((t) => normalize(t).includes(q))
      if (!(matchesTitle || matchesNotes || matchesSource || matchesTags)) return false
    }
    if (filters.program && r.program !== filters.program) return false
    if (filters.difficulty && r.difficulty !== filters.difficulty) return false
    if (filters.section && r.section !== filters.section) return false
    return true
  })
}
