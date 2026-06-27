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
    if (filters.showMine && r.created_by !== userEmail) return false
    if (filters.showFavorites && !r.is_favorited) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (!r.title.toLowerCase().includes(q)) return false
    }
    if (filters.program && r.program !== filters.program) return false
    if (filters.difficulty && r.difficulty !== filters.difficulty) return false
    if (filters.section && r.section !== filters.section) return false
    return true
  })
}
