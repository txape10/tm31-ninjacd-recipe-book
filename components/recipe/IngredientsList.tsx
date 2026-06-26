import type { IngredientGroup } from '@/lib/recipes'

type Props = {
  groups: IngredientGroup[]
}

export default function IngredientsList({ groups }: Props) {
  if (groups.length === 0) return null

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold text-foreground">Ingredientes</h2>
      {groups.map((group) => (
        <div key={group.id}>
          {group.label && (
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              {group.label}
            </h3>
          )}
          <ul className="space-y-1.5">
            {group.items.map((item) => (
              <li key={`${group.id}-${item}`} className="flex items-start gap-2 text-sm font-mono text-foreground">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
