import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import RecipeForm from '@/components/recipe/RecipeForm'

export default async function NuevaRecetaPage() {
  const session = await getSession()
  if (!session.user) redirect('/login')

  return (
    <div className="p-6">
      <h1 className="font-heading text-2xl font-bold text-foreground mb-8">Nueva receta</h1>
      <RecipeForm
        mode="create"
        initial={{
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
        }}
      />
    </div>
  )
}
