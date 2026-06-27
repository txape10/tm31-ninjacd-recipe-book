import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getRecipeDetail, canEditRecipe } from '@/lib/recipes'
import { isValidImageUrl } from '@/lib/constants'
import IngredientsList from '@/components/recipe/IngredientsList'
import StepsList from '@/components/recipe/StepsList'
import StarRating from '@/components/recipe/StarRating'
import FavoriteButton from '@/components/recipe/FavoriteButton'
import DeleteRecipeButton from '@/components/recipe/DeleteRecipeButton'
import ExportRecipeButton from '@/components/recipe/ExportRecipeButton'

export default async function RecetaPage(props: PageProps<'/recetas/[slug]'>) {
  const { slug } = await props.params
  const session = await getSession()
  const recipe = await getRecipeDetail(slug, session.user)

  if (!recipe) notFound()

  const canEdit = canEditRecipe(recipe, session.user)

  return (
    <div className="max-w-2xl space-y-8">
      {/* Hero — foto o gradiente */}
      <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/10">
        {isValidImageUrl(recipe.cover_image_url) ? (
          <Image
            src={recipe.cover_image_url}
            alt={recipe.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-7xl select-none" aria-hidden>🍦</span>
          </div>
        )}
      </div>

      {/* Cabecera */}
      <div className="px-6 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            {recipe.title}
          </h1>
          <div className="flex items-center gap-2 shrink-0 mt-1 flex-wrap justify-end">
            <FavoriteButton
              recipeId={recipe.id}
              initialFavorited={recipe.is_favorited}
              canFavorite={!!session.user}
            />
            <ExportRecipeButton recipe={recipe} />
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              recipe.is_public
                ? 'bg-green-500/15 text-green-400'
                : 'bg-yellow-500/15 text-yellow-400'
            }`}>
              {recipe.is_public ? 'Pública' : 'Privada'}
            </span>
            {canEdit && (
              <>
                <Link
                  href={`/recetas/${recipe.slug}/editar`}
                  className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium hover:bg-primary/25 transition-colors"
                >
                  Editar
                </Link>
                <Link
                  href={`/recetas/nueva?clone=${recipe.id}`}
                  className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
                >
                  Clonar
                </Link>
                <DeleteRecipeButton recipeId={recipe.id} recipeTitle={recipe.title} />
              </>
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
      <div className="px-6">
        <IngredientsList groups={recipe.ingredient_groups} />
      </div>

      {/* Pasos */}
      <div className="px-6">
        <StepsList steps={recipe.steps} />
      </div>

      {/* Notas */}
      {recipe.notes && (
        <section className="px-6 space-y-2">
          <h2 className="font-heading text-xl font-semibold text-foreground">Notas</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{recipe.notes}</p>
        </section>
      )}

      {/* Fuente */}
      {recipe.source && (
        <p className="px-6 pb-6 text-xs text-muted-foreground border-t border-border pt-4">
          Fuente: {recipe.source}
        </p>
      )}
    </div>
  )
}
