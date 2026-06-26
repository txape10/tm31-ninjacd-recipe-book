import { getSession } from '@/lib/auth'
import { getRecipes } from '@/lib/recipes'
import RecipeCard from '@/components/recipe/RecipeCard'

export default async function RecetasPage() {
  const session = await getSession()
  const recipes = await getRecipes(session.user)

  const bySection = recipes.reduce<Record<string, typeof recipes>>((acc, r) => {
    if (!acc[r.section]) acc[r.section] = []
    acc[r.section].push(r)
    return acc
  }, {})

  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-96 gap-4 text-center px-8">
        <p className="text-4xl">🍦</p>
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Aún no hay recetas
        </h2>
        <p className="text-muted-foreground text-sm">
          Añade tu primera receta para empezar.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-10">
      <h2 className="font-heading text-2xl font-bold text-foreground">Recetas</h2>

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
  )
}
