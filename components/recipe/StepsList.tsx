import type { RecipeStep } from '@/lib/recipes'

type Props = {
  steps: RecipeStep[]
}

const APPLIANCE_LABEL: Record<string, string> = {
  tm31: 'Thermomix TM31',
  ninja: 'Ninja CREAMi Deluxe',
}

const APPLIANCE_COLOR: Record<string, string> = {
  tm31: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  ninja: 'bg-primary/10 text-primary border-primary/20',
}

export default function StepsList({ steps }: Props) {
  if (steps.length === 0) return null

  const byAppliance = steps.reduce<Record<string, RecipeStep[]>>((acc, step) => {
    if (!acc[step.appliance]) acc[step.appliance] = []
    acc[step.appliance].push(step)
    return acc
  }, {})

  // tm31 siempre primero
  const order = ['tm31', 'ninja'].filter((a) => byAppliance[a])

  return (
    <section className="space-y-6">
      <h2 className="font-heading text-xl font-semibold text-foreground">Preparación</h2>
      {order.map((appliance) => (
        <div key={appliance} className="space-y-3">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${APPLIANCE_COLOR[appliance]}`}>
            {APPLIANCE_LABEL[appliance] ?? appliance}
          </div>
          <ol className="space-y-4">
            {byAppliance[appliance].map((step) => (
              <li key={step.id} className="flex gap-4">
                <span className="flex-none w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground mt-0.5">
                  {step.step_order}
                </span>
                <div className="space-y-0.5">
                  {step.title && (
                    <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  )}
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </section>
  )
}
