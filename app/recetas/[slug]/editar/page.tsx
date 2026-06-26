import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getRecipeDetail, canEditRecipe } from '@/lib/recipes'
import RecipeForm from '@/components/recipe/RecipeForm'

export default async function EditarRecetaPage(props: PageProps<'/recetas/[slug]/editar'>) {
  const { slug } = await props.params
  const session = await getSession()
  if (!session.user) redirect('/login')

  const recipe = await getRecipeDetail(slug, session.user)
  if (!recipe) notFound()
  if (!canEditRecipe(recipe, session.user)) redirect(`/recetas/${slug}`)

  return (
    <div className="p-6">
      <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Editar receta</h1>
      <p className="text-muted-foreground text-sm mb-8">{recipe.title}</p>
      <RecipeForm
        mode="edit"
        initial={{
          id: recipe.id,
          title: recipe.title,
          slug: recipe.slug,
          section: recipe.section,
          appliance: recipe.appliance,
          program: recipe.program,
          difficulty: recipe.difficulty as 'Fácil' | 'Media' | 'Media-Alta' | 'Alta',
          calories_per_serving: recipe.calories_per_serving,
          source: recipe.source ?? '',
          notes: recipe.notes ?? '',
          has_mixin: recipe.has_mixin === 1,
          is_public: recipe.is_public,
          tags: recipe.tags,
          ingredient_groups: recipe.ingredient_groups.map(g => ({
            label: g.label ?? '',
            items: g.items,
          })),
          steps: recipe.steps.map(s => ({
            appliance: s.appliance,
            title: s.title ?? '',
            description: s.description,
          })),
        }}
      />
    </div>
  )
}
