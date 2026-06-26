'use client'

export type GroupData = {
  label: string
  items: string[]
}

type Props = {
  groups: GroupData[]
  onChange: (groups: GroupData[]) => void
}

export default function IngredientGroupEditor({ groups, onChange }: Props) {
  function updateGroup(index: number, patch: Partial<GroupData>) {
    const next = groups.map((g, i) => i === index ? { ...g, ...patch } : g)
    onChange(next)
  }

  function addGroup() {
    onChange([...groups, { label: '', items: [''] }])
  }

  function removeGroup(index: number) {
    onChange(groups.filter((_, i) => i !== index))
  }

  function addItem(groupIndex: number) {
    updateGroup(groupIndex, { items: [...groups[groupIndex].items, ''] })
  }

  function updateItem(groupIndex: number, itemIndex: number, value: string) {
    const items = groups[groupIndex].items.map((it, i) => i === itemIndex ? value : it)
    updateGroup(groupIndex, { items })
  }

  function removeItem(groupIndex: number, itemIndex: number) {
    const items = groups[groupIndex].items.filter((_, i) => i !== itemIndex)
    updateGroup(groupIndex, { items })
  }

  return (
    <div className="space-y-4">
      {groups.map((group, gi) => (
        <div key={gi} className="border border-border rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Nombre del grupo (ej: Base, Mix-In) — opcional"
              value={group.label}
              onChange={e => updateGroup(gi, { label: e.target.value })}
              className="flex-1 text-sm bg-input border border-border rounded-md px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {groups.length > 1 && (
              <button
                type="button"
                onClick={() => removeGroup(gi)}
                className="text-xs text-destructive hover:text-destructive/80 px-2 py-1 rounded"
              >
                Quitar grupo
              </button>
            )}
          </div>

          <div className="space-y-1.5 pl-2">
            {group.items.map((item, ii) => (
              <div key={ii} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Ingrediente ${ii + 1}`}
                  value={item}
                  onChange={e => updateItem(gi, ii, e.target.value)}
                  className="flex-1 font-mono text-xs bg-input border border-border rounded-md px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                {group.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(gi, ii)}
                    className="text-muted-foreground hover:text-destructive text-sm leading-none px-1"
                    aria-label="Quitar ingrediente"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addItem(gi)}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              + Añadir ingrediente
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addGroup}
        className="text-sm text-muted-foreground hover:text-foreground border border-dashed border-border rounded-lg px-4 py-2 w-full transition-colors"
      >
        + Añadir grupo de ingredientes
      </button>
    </div>
  )
}
