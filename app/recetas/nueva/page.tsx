import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getRecipeDetailById } from '@/lib/recipes'
import RecipeForm from '@/components/recipe/RecipeForm'

type Props = {
  searchParams: Promise<{ clone?: string }>
}

export default async function NuevaRecetaPage({ searchParams }: Props) {
  const [session, params] = await Promise.all([getSession(), searchParams])
  if (!session.user) redirect('/login')

  let cloned = null
  if (params.clone) {
    cloned = await getRecipeDetailById(params.clone, session.user)
  }

  const initial = cloned
    ? {
        title: `${cloned.title} (copia)`,
        slug: `${cloned.slug}-copia`,
        section: cloned.section,
        appliance: cloned.appliance,
        program: cloned.program,
        difficulty: cloned.difficulty,
        calories_per_serving: cloned.calories_per_serving,
        source: cloned.source ?? '',
        notes: cloned.notes ?? '',
        has_mixin: cloned.has_mixin === 1,
        is_public: false,
        tags: cloned.tags,
        ingredient_groups: cloned.ingredient_groups.map((g) => ({
          label: g.label ?? '',
          items: g.items,
        })),
        steps: cloned.steps.map((s) => ({
          appliance: s.appliance,
          title: s.title ?? '',
          description: s.description,
        })),
      }
    : {
        title: '',
        slug: '',
        section: '',
        appliance: 'ninja-creami',
        program: '',
        difficulty: 'Fácil',
        calories_per_serving: null,
        source: '',
        notes: '',
        has_mixin: false,
        is_public: false,
        tags: [],
        ingredient_groups: [{ label: '', items: [''] }],
        steps: [],
      }

  return (
    <div className="p-6">
      <h1 className="font-heading text-2xl font-bold text-foreground mb-8">
        {cloned ? `Clonar: ${cloned.title}` : 'Nueva receta'}
      </h1>
      <RecipeForm mode="create" initial={initial} />
    </div>
  )
}
