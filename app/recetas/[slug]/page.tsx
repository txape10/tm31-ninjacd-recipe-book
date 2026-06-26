import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getRecipeDetail, canEditRecipe } from '@/lib/recipes'
import IngredientsList from '@/components/recipe/IngredientsList'
import StepsList from '@/components/recipe/StepsList'
import StarRating from '@/components/recipe/StarRating'
import FavoriteButton from '@/components/recipe/FavoriteButton'

export default async function RecetaPage(props: PageProps<'/recetas/[slug]'>) {
  const { slug } = await props.params
  const session = await getSession()
  const recipe = await getRecipeDetail(slug, session.user)

  if (!recipe) notFound()

  const canEdit = canEditRecipe(recipe, session.user)

  return (
    <div className="p-6 max-w-2xl space-y-8">
      {/* Cabecera */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            {recipe.title}
          </h1>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            <FavoriteButton
              recipeId={recipe.id}
              initialFavorited={recipe.is_favorited}
              canFavorite={!!session.user}
            />
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              recipe.is_public
                ? 'bg-green-500/15 text-green-400'
                : 'bg-yellow-500/15 text-yellow-400'
            }`}>
              {recipe.is_public ? 'Pública' : 'Privada'}
            </span>
            {canEdit && (
              <Link
                href={`/recetas/${recipe.slug}/editar`}
                className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium hover:bg-primary/25 transition-colors"
              >
                Editar
              </Link>
            )}
          </div>
        </div>

        <p className="text-muted-foreground text-sm">
          {recipe.program} · {recipe.difficulty}
          {recipe.calories_per_serving ? ` · ${recipe.calories_per_serving} kcal` : ''}
        </p>

        <StarRating
          recipeId={recipe.id}
          avgRating={recipe.avg_rating}
          ratingCount={recipe.rating_count}
          userRating={recipe.user_rating}
          canRate={!!session.user}
        />

        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Creada por <span className="text-foreground">{recipe.created_by || 'desconocido'}</span>
        </p>
      </div>

      <hr className="border-border" />

      {/* Ingredientes */}
      <IngredientsList groups={recipe.ingredient_groups} />

      {/* Pasos */}
      <StepsList steps={recipe.steps} />

      {/* Notas */}
      {recipe.notes && (
        <section className="space-y-2">
          <h2 className="font-heading text-xl font-semibold text-foreground">Notas</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{recipe.notes}</p>
        </section>
      )}

      {/* Fuente */}
      {recipe.source && (
        <p className="text-xs text-muted-foreground border-t border-border pt-4">
          Fuente: {recipe.source}
        </p>
      )}
    </div>
  )
}
