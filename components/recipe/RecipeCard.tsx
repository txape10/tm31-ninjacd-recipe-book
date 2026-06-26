import Link from 'next/link'
import type { RecipeWithTags } from '@/lib/recipes'
import FavoriteButton from '@/components/recipe/FavoriteButton'

const DIFFICULTY_COLOR: Record<string, string> = {
  'Fácil': 'text-green-400',
  'Media': 'text-yellow-400',
  'Media-Alta': 'text-orange-400',
  'Alta': 'text-red-400',
}

type Props = {
  recipe: RecipeWithTags
  currentUserEmail?: string
}

export default function RecipeCard({ recipe, currentUserEmail }: Props) {
  const isOwner = currentUserEmail === recipe.created_by
  const canFavorite = !!currentUserEmail

  return (
    <article className="bg-card border border-border rounded-xl p-4 h-full hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 relative">
      {/* Botón favorito — fuera del Link para no capturar el click del anchor */}
      <div className="absolute top-3 right-3">
        <FavoriteButton
          recipeId={recipe.id}
          initialFavorited={recipe.is_favorited}
          canFavorite={canFavorite}
        />
      </div>

      <Link href={`/recetas/${recipe.slug}`} className="block group">
        <div className="flex items-start gap-2 mb-2 pr-6">
          <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
            {recipe.title}
          </h3>
          {isOwner && !recipe.is_public && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 font-medium shrink-0 mt-0.5">
              Privada
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
          <span>{recipe.program}</span>
          <span className={DIFFICULTY_COLOR[recipe.difficulty] ?? 'text-muted-foreground'}>
            {recipe.difficulty}
          </span>
          {recipe.calories_per_serving && (
            <span>{recipe.calories_per_serving} kcal</span>
          )}
          {recipe.has_mixin === 1 && (
            <span className="text-accent">+ mix-in</span>
          )}
        </div>

        {/* Rating */}
        {recipe.avg_rating !== null ? (
          <p className="text-xs text-muted-foreground mb-2">
            <span className="text-yellow-400">★</span>{' '}
            <span className="font-semibold text-foreground">{recipe.avg_rating.toFixed(1)}</span>
            {' '}({recipe.rating_count} {recipe.rating_count === 1 ? 'voto' : 'votos'})
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/50 mb-2">Sin valorar</p>
        )}

        {!isOwner && (
          <p className="text-xs text-muted-foreground truncate">
            {recipe.created_by}
          </p>
        )}

        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
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
      </Link>
    </article>
  )
}
