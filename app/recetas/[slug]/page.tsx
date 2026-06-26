import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getRecipeBySlug, canEditRecipe } from '@/lib/recipes'

export default async function RecetaPage(props: PageProps<'/recetas/[slug]'>) {
  const { slug } = await props.params
  const session = await getSession()
  const recipe = await getRecipeBySlug(slug, session.user)

  if (!recipe) notFound()

  const canEdit = canEditRecipe(recipe, session.user)

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          {recipe.title}
        </h1>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            recipe.is_public
              ? 'bg-green-500/15 text-green-400'
              : 'bg-yellow-500/15 text-yellow-400'
          }`}>
            {recipe.is_public ? 'Pública' : 'Privada'}
          </span>
          {canEdit && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
              Editar
            </span>
          )}
        </div>
      </div>

      <p className="text-muted-foreground text-sm">
        {recipe.program} · {recipe.difficulty}
        {recipe.calories_per_serving ? ` · ${recipe.calories_per_serving} kcal` : ''}
        {recipe.rating ? ` · ★ ${recipe.rating.toFixed(1)}` : ''}
      </p>

      <p className="text-xs text-muted-foreground">
        Creada por <span className="text-foreground">{recipe.created_by || 'desconocido'}</span>
      </p>

      <p className="mt-8 text-muted-foreground text-sm">
        Ingredientes y pasos — Fase 3.
      </p>
    </div>
  )
}
