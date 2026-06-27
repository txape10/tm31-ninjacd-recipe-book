'use client'

import { useState } from 'react'
import type { RecipeDetail } from '@/lib/recipes'

type Props = {
  recipe: RecipeDetail
}

function formatRecipeAsText(recipe: RecipeDetail): string {
  const lines: string[] = []

  lines.push(recipe.title.toUpperCase())
  lines.push('='.repeat(recipe.title.length))
  lines.push('')
  lines.push(`Programa: ${recipe.program}  |  Dificultad: ${recipe.difficulty}`)
  if (recipe.calories_per_serving) {
    lines.push(`Calorías: ${recipe.calories_per_serving} kcal/ración`)
  }
  if (recipe.source) lines.push(`Fuente: ${recipe.source}`)
  lines.push('')

  if (recipe.ingredient_groups.length > 0) {
    lines.push('INGREDIENTES')
    lines.push('-'.repeat(12))
    for (const group of recipe.ingredient_groups) {
      if (group.label) lines.push(`[${group.label}]`)
      for (const item of group.items) lines.push(`• ${item}`)
    }
    lines.push('')
  }

  const ninjaSteps = recipe.steps.filter((s) => s.appliance === 'ninja')
  const tm31Steps = recipe.steps.filter((s) => s.appliance === 'tm31')

  if (ninjaSteps.length > 0) {
    lines.push('PASOS (Ninja CREAMi)')
    lines.push('-'.repeat(20))
    ninjaSteps.forEach((s, i) => {
      lines.push(`${i + 1}. ${s.title ? `${s.title}: ` : ''}${s.description}`)
    })
    lines.push('')
  }

  if (tm31Steps.length > 0) {
    lines.push('PASOS (Thermomix TM31)')
    lines.push('-'.repeat(22))
    tm31Steps.forEach((s, i) => {
      lines.push(`${i + 1}. ${s.title ? `${s.title}: ` : ''}${s.description}`)
    })
    lines.push('')
  }

  if (recipe.notes) {
    lines.push('NOTAS')
    lines.push('-'.repeat(5))
    lines.push(recipe.notes)
  }

  return lines.join('\n')
}

export default function ExportRecipeButton({ recipe }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(formatRecipeAsText(recipe))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available (non-https or blocked)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
    >
      {copied ? '¡Copiado!' : 'Copiar texto'}
    </button>
  )
}
