'use client'

import { validatePasswordStrength } from '@/lib/password-strength'

type Props = { password: string }

const LABELS = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Fuerte']
const BAR_COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-lime-500',
  'bg-green-500',
]

export default function PasswordStrengthIndicator({ password }: Props) {
  if (!password) return null

  const { score, errors } = validatePasswordStrength(password)

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i < score ? BAR_COLORS[score] : 'bg-border'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Robustez: <span className={score >= 4 ? 'text-green-500 font-medium' : 'text-orange-400 font-medium'}>{LABELS[score]}</span>
      </p>
      {errors.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-0.5">
          {errors.map((e) => (
            <li key={e} className="flex items-center gap-1">
              <span className="text-destructive">✗</span> {e}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
