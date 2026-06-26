import { notFound } from 'next/navigation'
import { getRecipeBySlug } from '@/lib/recipes'

export default async function RecetaPage(props: PageProps<'/recetas/[slug]'>) {
  const { slug } = await props.params
  const recipe = await getRecipeBySlug(slug)

  if (!recipe) notFound()

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
        {recipe.title}
      </h1>
      <p className="text-muted-foreground text-sm">
        {recipe.program} · {recipe.difficulty}
        {recipe.calories_per_serving ? ` · ${recipe.calories_per_serving} kcal` : ''}
      </p>
      <p className="mt-8 text-muted-foreground">
        Detalle completo — Fase 3.
      </p>
    </div>
  )
}
