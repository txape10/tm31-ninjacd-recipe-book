import { Suspense } from 'react'
import { getSession } from '@/lib/auth'
import { getRecipes } from '@/lib/recipes'
import { applyRecipeFilters } from '@/lib/filters'
import RecipeCard from '@/components/recipe/RecipeCard'
import SearchAndFilterBar from '@/components/recipe/SearchAndFilterBar'

type Props = {
  searchParams: Promise<{
    showMine?: string
    showFavorites?: string
    search?: string
    program?: string
    difficulty?: string
    section?: string
  }>
}

export default async function RecetasPage({ searchParams }: Props) {
  const [session, params] = await Promise.all([getSession(), searchParams])
  const allRecipes = await getRecipes(session.user)

  const recipes = applyRecipeFilters(
    allRecipes,
    {
      showMine: params.showMine === '1',
      showFavorites: params.showFavorites === '1',
      search: params.search,
      program: params.program,
      difficulty: params.difficulty,
      section: params.section,
    },
    session.user?.email,
  )

  const activeFilterBadges: string[] = []
  if (params.showMine === '1') activeFilterBadges.push('Mis recetas')
  if (params.showFavorites === '1') activeFilterBadges.push('Favoritos')

  const bySection = recipes.reduce<Record<string, typeof recipes>>((acc, r) => {
    if (!acc[r.section]) acc[r.section] = []
    acc[r.section].push(r)
    return acc
  }, {})

  const isEmpty = recipes.length === 0

  return (
    <div className="p-6 space-y-6">
      {/* Cabecera */}
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="font-heading text-2xl font-bold text-foreground">Recetas</h2>
        {activeFilterBadges.map((f) => (
          <span key={f} className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
            {f}
          </span>
        ))}
      </div>

      {/* Búsqueda y filtros */}
      <Suspense fallback={null}>
        <SearchAndFilterBar totalVisible={recipes.length} totalAll={allRecipes.length} />
      </Suspense>

      {/* Listado */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center min-h-72 gap-4 text-center px-8">
          <p className="text-4xl">🍦</p>
          <h3 className="font-heading text-lg font-semibold text-foreground">
            No hay recetas con estos filtros
          </h3>
          <p className="text-muted-foreground text-sm">
            Prueba a cambiar la búsqueda o quitar algún filtro.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(bySection).map(([section, sectionRecipes]) => (
            <section key={section}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                {section}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sectionRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} currentUserEmail={session.user?.email} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
