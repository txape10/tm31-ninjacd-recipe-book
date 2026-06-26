import Link from 'next/link'
import type { RecipeWithTags } from '@/lib/recipes'

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

  return (
    <Link href={`/recetas/${recipe.slug}`} className="block group">
      <article className="bg-card border border-border rounded-xl p-4 h-full hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
            {recipe.title}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            {recipe.rating && (
              <span className="text-xs font-mono text-accent">
                ★ {recipe.rating.toFixed(1)}
              </span>
            )}
            {isOwner && !recipe.is_public && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 font-medium">
                Privada
              </span>
            )}
          </div>
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

        {!isOwner && (
          <p className="text-xs text-muted-foreground mb-2 truncate">
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
      </article>
    </Link>
  )
}
