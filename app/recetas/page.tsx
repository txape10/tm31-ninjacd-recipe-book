import { getSession } from '@/lib/auth'
import { getRecipes } from '@/lib/recipes'
import RecipeCard from '@/components/recipe/RecipeCard'

type Props = {
  searchParams: Promise<{ showMine?: string; showFavorites?: string }>
}

export default async function RecetasPage({ searchParams }: Props) {
  const [session, params] = await Promise.all([getSession(), searchParams])
  const allRecipes = await getRecipes(session.user)

  const showMine = params.showMine === '1'
  const showFavorites = params.showFavorites === '1'

  const recipes = allRecipes.filter((r) => {
    if (showMine && r.created_by !== session.user?.email) return false
    if (showFavorites && !r.is_favorited) return false
    return true
  })

  const activeFilters: string[] = []
  if (showMine) activeFilters.push('Mis recetas')
  if (showFavorites) activeFilters.push('Favoritos')

  const bySection = recipes.reduce<Record<string, typeof recipes>>((acc, r) => {
    if (!acc[r.section]) acc[r.section] = []
    acc[r.section].push(r)
    return acc
  }, {})

  const isEmpty = recipes.length === 0

  return (
    <div className="p-6 space-y-10">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="font-heading text-2xl font-bold text-foreground">Recetas</h2>
        {activeFilters.map((f) => (
          <span key={f} className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
            {f}
          </span>
        ))}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-full min-h-72 gap-4 text-center px-8">
          <p className="text-4xl">🍦</p>
          <h3 className="font-heading text-lg font-semibold text-foreground">
            {activeFilters.length > 0 ? 'No hay recetas con estos filtros' : 'Aún no hay recetas'}
          </h3>
          {activeFilters.length === 0 && (
            <p className="text-muted-foreground text-sm">Añade tu primera receta para empezar.</p>
          )}
        </div>
      ) : (
        Object.entries(bySection).map(([section, sectionRecipes]) => (
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
        ))
      )}
    </div>
  )
}
