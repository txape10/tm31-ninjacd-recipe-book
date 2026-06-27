import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import TagsManager from '@/components/recipe/TagsManager'

export default async function TagsPage() {
  const session = await getSession()
  if (!session.user) redirect('/login')
  if (!session.user.isAdmin) redirect('/recetas')

  const { rows } = await db.execute({
    sql: `SELECT t.id, t.name, COUNT(rt.recipe_id) AS recipe_count
            FROM tags t
            LEFT JOIN recipe_tags rt ON rt.tag_id = t.id
           GROUP BY t.id
           ORDER BY recipe_count DESC, t.name`,
    args: [],
  })

  const tags = rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    recipe_count: Number(r.recipe_count),
  }))

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-bold text-foreground">Gestión de tags</h2>
        <p className="text-sm text-muted-foreground mt-1">{tags.length} tags en total</p>
      </div>
      <TagsManager initialTags={tags} />
    </div>
  )
}
