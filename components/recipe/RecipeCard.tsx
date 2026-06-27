import Link from 'next/link'
import Image from 'next/image'
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
    <article className="bg-card border border-border rounded-xl overflow-hidden h-full group hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-200 relative">
      {/* Botón favorito — fuera del Link para no capturar el click del anchor */}
      <div className="absolute top-3 right-3 z-10">
        <FavoriteButton
          recipeId={recipe.id}
          initialFavorited={recipe.is_favorited}
          canFavorite={canFavorite}
        />
      </div>

      <Link href={`/recetas/${recipe.slug}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-xl">
        {/* Foto / placeholder */}
        <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/10">
          {recipe.cover_image_url ? (
            <Image
              src={recipe.cover_image_url}
              alt={recipe.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl select-none" aria-hidden>🍦</span>
            </div>
          )}
          {/* Insignia privada sobre la foto */}
          {isOwner && !recipe.is_public && (
            <span className="absolute bottom-2 left-2 text-xs px-1.5 py-0.5 rounded-full bg-black/60 text-yellow-400 font-medium backdrop-blur-sm">
              Privada
            </span>
          )}
        </div>

        {/* Contenido */}
        <div className="p-4">
          <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors leading-tight mb-2 pr-6">
            {recipe.title}
          </h3>

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
        </div>
      </Link>
    </article>
  )
}
