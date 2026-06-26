'use client'

import { useState } from 'react'

export type StepData = {
  appliance: 'tm31' | 'ninja'
  title: string
  description: string
}

type Props = {
  steps: StepData[]
  onChange: (steps: StepData[]) => void
}

const APPLIANCES = [
  { value: 'tm31' as const, label: 'Thermomix TM31', color: 'text-orange-400' },
  { value: 'ninja' as const, label: 'Ninja CREAMi', color: 'text-blue-400' },
]

export default function RecipeStepsEditor({ steps, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<'tm31' | 'ninja'>('tm31')

  const stepsForTab = steps.filter(s => s.appliance === activeTab)
  const otherSteps = steps.filter(s => s.appliance !== activeTab)

  function replaceTabSteps(newTabSteps: StepData[]) {
    const ordered = activeTab === 'tm31'
      ? [...newTabSteps, ...otherSteps]
      : [...otherSteps, ...newTabSteps]
    onChange(ordered)
  }

  function addStep() {
    replaceTabSteps([...stepsForTab, { appliance: activeTab, title: '', description: '' }])
  }

  function updateStep(index: number, patch: Partial<StepData>) {
    replaceTabSteps(stepsForTab.map((s, i) => i === index ? { ...s, ...patch } : s))
  }

  function removeStep(index: number) {
    replaceTabSteps(stepsForTab.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {APPLIANCES.map(({ value, label, color }) => (
          <button
            key={value}
            type="button"
            onClick={() => setActiveTab(value)}
            className={[
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === value
                ? `${color} border-current`
                : 'text-muted-foreground border-transparent hover:text-foreground',
            ].join(' ')}
          >
            {label}
            {steps.filter(s => s.appliance === value).length > 0 && (
              <span className="ml-1.5 text-xs opacity-60">
                ({steps.filter(s => s.appliance === value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Pasos del tab activo */}
      <div className="space-y-3">
        {stepsForTab.map((step, i) => (
          <div key={i} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground w-6 shrink-0">
                {i + 1}.
              </span>
              <input
                type="text"
                placeholder="Título del paso (opcional)"
                value={step.title}
                onChange={e => updateStep(i, { title: e.target.value })}
                className="flex-1 text-sm bg-input border border-border rounded-md px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => removeStep(i)}
                className="text-muted-foreground hover:text-destructive text-lg leading-none px-1"
                aria-label="Quitar paso"
              >
                ×
              </button>
            </div>
            <textarea
              placeholder="Descripción del paso..."
              value={step.description}
              rows={2}
              onChange={e => updateStep(i, { description: e.target.value })}
              className="w-full text-sm bg-input border border-border rounded-md px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>
        ))}

        <button
          type="button"
          onClick={addStep}
          className="text-sm text-muted-foreground hover:text-foreground border border-dashed border-border rounded-lg px-4 py-2 w-full transition-colors"
        >
          + Añadir paso
        </button>
      </div>
    </div>
  )
}
