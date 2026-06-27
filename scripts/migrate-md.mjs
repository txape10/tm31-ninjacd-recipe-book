// @ts-check
// Convierte los archivos markdown de recetas al nuevo esquema (docs/SCHEMA.md).
// Lee los .md actuales con los parsers legacy y los reescribe en formato canónico.
// Ejecutar UNA VEZ y luego borrar o archivar este script.
//
// Uso: node scripts/migrate-md.mjs

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ---------------------------------------------------------------------------
// Parsers legacy (copiados del seed-all.mjs anterior para leer el formato viejo)
// ---------------------------------------------------------------------------

function extractH4Block(sectionText, startHeader, endHeaders) {
  const startPattern = new RegExp(`#### ${startHeader}[^\n]*\n`)
  const startMatch = sectionText.match(startPattern)
  if (!startMatch) return ''
  const startIdx = startMatch.index + startMatch[0].length
  let endIdx = sectionText.length
  for (const endH of endHeaders) {
    const endPattern = new RegExp(`#### ${endH}`)
    const endMatch = sectionText.slice(startIdx).match(endPattern)
    if (endMatch) {
      const candidate = startIdx + endMatch.index
      if (candidate < endIdx) endIdx = candidate
    }
  }
  const hrMatch = sectionText.slice(startIdx).match(/\n---/)
  if (hrMatch) {
    const candidate = startIdx + hrMatch.index
    if (candidate < endIdx) endIdx = candidate
  }
  return sectionText.slice(startIdx, endIdx).trim()
}

function parseIngredients(text) {
  const groups = []
  const lines = text.split('\n')
  let currentLabel = null
  let currentItems = []
  const pushGroup = () => { if (currentItems.length > 0) groups.push({ label: currentLabel, items: [...currentItems] }) }
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const inlineGroupMatch = trimmed.match(/^\*\*(.+?):\*\*\s+(.+)$/)
    if (inlineGroupMatch) {
      pushGroup(); currentLabel = inlineGroupMatch[1].trim()
      const inlineItems = inlineGroupMatch[2]
      currentItems = inlineItems.includes(' · ') ? inlineItems.split(' · ').map(s => s.trim()).filter(Boolean) : [inlineItems.trim()]
      continue
    }
    const groupMatch = trimmed.match(/^\*\*(.+?)\*\*:?\s*$/) || trimmed.match(/^\*\*(.+?):\*\*\s*$/)
    if (groupMatch) { pushGroup(); currentLabel = groupMatch[1].replace(/:$/, '').trim(); currentItems = []; continue }
    if (trimmed.startsWith('- ')) {
      const raw = trimmed.slice(2).trim()
      if (raw.includes(' · ')) currentItems.push(...raw.split(' · ').map(s => s.trim()).filter(Boolean))
      else currentItems.push(raw)
    }
  }
  pushGroup()
  return groups
}

function parseTm31Steps(text) {
  if (!text.trim()) return []
  const hasNumberedSteps = /\*\*Paso\s+\d+\s+—/.test(text)
  if (!hasNumberedSteps) return [{ title: null, description: text.trim() }]
  const steps = []
  const blocks = text.split(/(?=\*\*Paso\s+\d+\s+—)/)
  for (const block of blocks) {
    const titleMatch = block.match(/^\*\*Paso\s+(\d+)\s+—\s+(.+?)\*\*/)
    if (!titleMatch) continue
    const title = titleMatch[2].trim()
    const description = block.slice(titleMatch[0].length).replace(/^\n+/, '').trim()
    steps.push({ title, description })
  }
  return steps
}

function parseNinjaSteps(text) {
  if (!text.trim()) return [{ title: null, description: text.trim() }]
  const lines = text.split('\n')
  const hasNumberedLines = lines.some(l => /^\d+\.\s+.+/.test(l.trim()))
  if (!hasNumberedLines) {
    // Formato **Paso N — Título** (nuevo formato en pasos TM31 reescritos)
    const hasStepHeaders = /\*\*Paso\s+\d+\s+—/.test(text)
    if (hasStepHeaders) {
      const steps = []
      const blocks = text.split(/(?=\*\*Paso\s+\d+\s+—)/)
      for (const block of blocks) {
        const m = block.match(/^\*\*Paso\s+\d+\s+—\s+(.+?)\*\*/)
        if (!m) continue
        const title = m[1].trim()
        const description = block.slice(m[0].length).replace(/^\n+/, '').trim()
        steps.push({ title, description })
      }
      return steps.length > 0 ? steps : [{ title: null, description: text.trim() }]
    }
    return [{ title: null, description: text.trim() }]
  }
  const steps = []
  for (const line of lines) {
    const t = line.trim()
    const m = t.match(/^(\d+)\.\s+(.+)$/)
    if (!m) continue
    const fullText = m[2].trim()
    const boldTitle = fullText.match(/^\*\*(.+?)\*\*[:\s]+(.*)$/)
    if (boldTitle) { steps.push({ title: boldTitle[1].trim(), description: boldTitle[2].trim() }); continue }
    const dotIdx = fullText.indexOf('.')
    if (dotIdx > 0 && dotIdx < 80) steps.push({ title: fullText.slice(0, dotIdx).trim(), description: fullText.slice(dotIdx + 1).trim() })
    else steps.push({ title: null, description: fullText })
  }
  return steps
}

// ---------------------------------------------------------------------------
// Serialización al nuevo esquema
// ---------------------------------------------------------------------------

function serializeIngredientGroups(groups) {
  if (groups.length === 0) return ''
  const lines = []
  for (const group of groups) {
    if (group.label) lines.push(`**${group.label}:**`)
    for (const item of group.items) lines.push(`- ${item}`)
    lines.push('')
  }
  return lines.join('\n').trimEnd()
}

function serializeSteps(tm31Steps, ninjaSteps) {
  const lines = []
  let stepOrder = 1

  for (const step of tm31Steps) {
    const title = step.title || 'Preparación'
    lines.push(`**Paso ${stepOrder} — TM31 — ${title}**`)
    lines.push(step.description)
    lines.push('')
    stepOrder++
  }

  for (const step of ninjaSteps) {
    const title = step.title || 'Paso Ninja'
    lines.push(`**Paso ${stepOrder} — Ninja — ${title}**`)
    lines.push(step.description)
    lines.push('')
    stepOrder++
  }

  return lines.join('\n').trimEnd()
}

function serializeRecipe(recipe, code) {
  const lines = []

  // Cabecera
  if (code) {
    lines.push(`### ${code} · ${recipe.title}`)
  } else {
    lines.push(`### ${recipe.num}. ${recipe.title}`)
  }
  lines.push('')

  // Metadatos
  lines.push(`**Programa Ninja:** ${recipe.program}`)
  lines.push(`**Dificultad:** ${recipe.difficulty}`)
  lines.push(`**Calorías/ración:** ${recipe.calories_per_serving ?? 'null'}`)
  lines.push(`**Mix-In:** ${recipe.has_mixin ? 'Sí' : 'No'}`)
  lines.push(`**Tags:** ${recipe.tags.join(', ')}`)
  if (recipe.source) lines.push(`**Fuente:** ${recipe.source}`)
  if (recipe.notes) lines.push(`**Notas:** ${recipe.notes}`)
  lines.push('')

  // Ingredientes
  lines.push('#### Ingredientes')
  lines.push('')
  lines.push(serializeIngredientGroups(recipe.ingredientGroups))
  lines.push('')

  // Pasos
  lines.push('#### Pasos')
  lines.push('')
  lines.push(serializeSteps(recipe.tm31Steps, recipe.ninjaSteps))

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Migración del recetario personal
// ---------------------------------------------------------------------------

const RECIPE_META = {
  '1.1': { program: 'Ice Cream', has_mixin: 1, tags: ['chocolate', 'clásico'], source: 'Recetario Helados Ninja · Receta 1.1' },
  '1.2': { program: 'Ice Cream', has_mixin: 1, tags: ['galletas', 'vainilla', 'clásico'], source: 'Recetario Helados Ninja · Receta 1.2' },
  '1.3': { program: 'Ice Cream', has_mixin: 0, tags: ['dulce-de-leche', 'caramelo'], source: 'Recetario Helados Ninja · Receta 1.3' },
  '1.4': { program: 'Ice Cream', has_mixin: 1, tags: ['chocolate', 'brownie', 'caramelo'], source: 'Recetario Helados Ninja · Receta 1.4' },
  '1.5': { program: 'Ice Cream', has_mixin: 1, tags: ['cacahuete', 'clásico'], source: 'Recetario Helados Ninja · Receta 1.5' },
  '1.6': { program: 'Ice Cream', has_mixin: 1, tags: ['frutos-secos', 'caramelo'], source: 'Recetario Helados Ninja · Receta 1.6' },
  '2.1': { program: 'Ice Cream', has_mixin: 0, tags: ['vainilla', 'clásico', 'sin-gluten'], source: 'Recetario Helados Ninja · Receta 2.1' },
  '2.2': { program: 'Ice Cream', has_mixin: 0, tags: ['pistacho', 'frutos-secos'], source: 'Recetario Helados Ninja · Receta 2.2' },
  '2.3': { program: 'Ice Cream', has_mixin: 0, tags: ['chocolate', 'clásico', 'sin-gluten'], source: 'Recetario Helados Ninja · Receta 2.3' },
  '2.4': { program: 'Ice Cream', has_mixin: 0, tags: ['chocolate', 'clásico'], source: 'Recetario Helados Ninja · Receta 2.4' },
  '2.5': { program: 'Ice Cream', has_mixin: 0, tags: ['chocolate-blanco'], source: 'Recetario Helados Ninja · Receta 2.5' },
  '2.6': { program: 'Ice Cream', has_mixin: 0, tags: ['café', 'clásico'], source: 'Recetario Helados Ninja · Receta 2.6' },
  '2.7': { program: 'Ice Cream', has_mixin: 0, tags: ['dulce-de-leche', 'caramelo', 'rápido'], source: 'Recetario Helados Ninja · Receta 2.7' },
  '2.8': { program: 'Ice Cream', has_mixin: 0, tags: ['limón', 'canela', 'clásico'], source: 'Recetario Helados Ninja · Receta 2.8' },
  '2.9': { program: 'Ice Cream', has_mixin: 1, tags: ['limón', 'galletas'], source: 'Recetario Helados Ninja · Receta 2.9' },
  '2.10': { program: 'Ice Cream', has_mixin: 0, tags: ['turrón', 'navidad', 'frutos-secos'], source: 'Recetario Helados Ninja · Receta 2.10' },
  '2.11': { program: 'Ice Cream', has_mixin: 0, tags: ['galletas', 'mantequilla'], source: 'Recetario Helados Ninja · Receta 2.11' },
  '2.12': { program: 'Ice Cream', has_mixin: 0, tags: ['fruta', 'cereza'], source: 'Recetario Helados Ninja · Receta 2.12' },
  '2.13': { program: 'Ice Cream', has_mixin: 0, tags: ['fruta', 'fresa', 'chuche'], source: 'Recetario Helados Ninja · Receta 2.13' },
  '2.14': { program: 'Ice Cream', has_mixin: 1, tags: ['galletas', 'chocolate', 'oreo'], source: 'Recetario Helados Ninja · Receta 2.14' },
  '2.15': { program: 'Ice Cream', has_mixin: 0, tags: ['caramelo', 'chuche'], source: 'Recetario Helados Ninja · Receta 2.15' },
  '2.16': { program: 'Ice Cream', has_mixin: 1, tags: ['cheesecake', 'galletas'], source: 'Recetario Helados Ninja · Receta 2.16' },
  '3.1': { program: 'Ice Cream', has_mixin: 0, tags: ['chuche', 'chicle'], source: 'Recetario Helados Ninja · Receta 3.1' },
  '3.2': { program: 'Ice Cream', has_mixin: 1, tags: ['chocolate', 'cereza', 'especial'], source: 'Recetario Helados Ninja · Receta 3.2' },
  '3.3': { program: 'Ice Cream', has_mixin: 1, tags: ['chocolate', 'especial', 'viral'], source: 'Recetario Helados Ninja · Receta 3.3' },
  '3.4': { program: 'Ice Cream', has_mixin: 0, tags: ['chocolate', 'fresa'], source: 'Recetario Helados Ninja · Receta 3.4' },
  '3.5': { program: 'Ice Cream', has_mixin: 1, tags: ['chocolate-blanco', 'avellana', 'especial'], source: 'Recetario Helados Ninja · Receta 3.5' },
  '3.6': { program: 'Ice Cream', has_mixin: 0, tags: ['café', 'mascarpone', 'especial'], source: 'Recetario Helados Ninja · Receta 3.6' },
  '3.7': { program: 'Ice Cream', has_mixin: 0, tags: ['caramelo', 'mantequilla', 'especial'], source: 'Recetario Helados Ninja · Receta 3.7' },
  '3.8': { program: 'Ice Cream', has_mixin: 0, tags: ['jengibre', 'especias'], source: 'Recetario Helados Ninja · Receta 3.8' },
  '4.1': { program: 'Sorbet', has_mixin: 0, tags: ['sorbete', 'fruta', 'vegano', 'sin-lácteos'], source: 'Recetario Helados Ninja · Receta 4.1' },
  '4.2': { program: 'Sorbet', has_mixin: 0, tags: ['sorbete', 'fruta', 'vegano', 'sin-lácteos'], source: 'Recetario Helados Ninja · Receta 4.2' },
  '4.3': { program: 'Sorbet', has_mixin: 0, tags: ['sorbete', 'fruta', 'vegano', 'sin-lácteos'], source: 'Recetario Helados Ninja · Receta 4.3' },
  '5.1': { program: 'Milkshake', has_mixin: 0, tags: ['batido', 'vainilla'], source: 'Recetario Helados Ninja · Receta 5.1' },
  '5.2': { program: 'Milkshake', has_mixin: 0, tags: ['batido', 'chocolate'], source: 'Recetario Helados Ninja · Receta 5.2' },
  '5.3': { program: 'Milkshake', has_mixin: 0, tags: ['batido', 'café', 'caramelo'], source: 'Recetario Helados Ninja · Receta 5.3' },
  '5.4': { program: 'Milkshake', has_mixin: 0, tags: ['batido', 'pistacho', 'frutos-secos'], source: 'Recetario Helados Ninja · Receta 5.4' },
  '5.5': { program: 'Frappé', has_mixin: 0, tags: ['frappé', 'vainilla', 'canela'], source: 'Recetario Helados Ninja · Receta 5.5' },
  '5.6': { program: 'Frappé', has_mixin: 0, tags: ['frappé', 'café'], source: 'Recetario Helados Ninja · Receta 5.6' },
}

const SECTIONS_PERSONAL = {
  '1': 'Häagen-Dazs',
  '2': 'Helados Clásicos',
  '3': 'Helados Especiales',
  '4': 'Sorbetes',
  '5': 'Batidos',
}

function migratePersonal(markdown) {
  const sectionBlocks = { '1': [], '2': [], '3': [], '4': [], '5': [] }

  for (const [code, meta] of Object.entries(RECIPE_META)) {
    const escapedCode = code.replace(/\./g, '\\.')
    const pattern = new RegExp(`(### ${escapedCode} ·[\\s\\S]+?)(?=\\n### \\d+\\.\\d+ ·|\\n## |$)`)
    const m = markdown.match(pattern)
    if (!m) { console.warn(`⚠️  ${code}: no encontrada`); continue }
    const sectionBlock = m[1]

    const titleMatch = sectionBlock.match(/### \d+\.\d+ · (.+)/)
    const title = titleMatch ? titleMatch[1].trim() : `Receta ${code}`

    const diffMatch = sectionBlock.match(/Dificultad:\*\*\s*([^·\n*]+)/)
    const difficulty = diffMatch ? diffMatch[1].trim() : 'Media'

    const ingText = extractH4Block(sectionBlock, 'Ingredientes', ['Preparación', 'Calorías', 'En la Ninja'])
    const ingredientGroups = parseIngredients(ingText)

    const tm31Text = extractH4Block(sectionBlock, 'Preparación en TM31', ['En la Ninja', 'Calorías'])
    const tm31Steps = parseTm31Steps(tm31Text)

    const ninjaText = extractH4Block(sectionBlock, 'En la Ninja CREAMi Deluxe', ['Calorías'])
    const ninjaSteps = parseNinjaSteps(ninjaText)

    const calMatch = sectionBlock.match(/~(\d+)\s*kcal/)
    const calories_per_serving = calMatch ? parseInt(calMatch[1]) : null

    const notesMatch = sectionBlock.match(/\*\*Versión\s+sin\s+restricciones:\*\*\s*([\s\S]+?)(?:\n---|\n###|\n##|$)/)
    const notes = notesMatch ? notesMatch[1].trim() : null

    const sectionNum = code.split('.')[0]
    const recipe = {
      title, program: meta.program, difficulty,
      calories_per_serving, has_mixin: meta.has_mixin,
      tags: meta.tags, source: meta.source, notes,
      ingredientGroups, tm31Steps, ninjaSteps,
    }

    sectionBlocks[sectionNum].push({ code, recipe })
  }

  const lines = ['# 🍨 Recetario de Helados — Ninja CREAMi Deluxe + Thermomix TM31', '', '---', '']
  for (const [sectionNum, recipes] of Object.entries(sectionBlocks)) {
    if (recipes.length === 0) continue
    lines.push(`## ${SECTIONS_PERSONAL[sectionNum]}`, '')
    for (const { code, recipe } of recipes) {
      lines.push(serializeRecipe(recipe, code))
      lines.push('')
      lines.push('---')
      lines.push('')
    }
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Migración del recetario oficial
// ---------------------------------------------------------------------------

const SECTIONS_OFFICIAL = {
  1: 'Helados Clásicos',
  2: 'Gelatos y Especiales',
  3: 'Veganos y Sin Lácteos',
  4: 'Sorbetes de Fruta',
  5: 'Sorbetes Especiales y con Alcohol',
  6: 'Batidos y Smoothie Bowls',
}

const PROGRAM_MAP = {
  'Ice Cream': 'Ice Cream', 'Gelato': 'Gelato', 'Sorbet': 'Sorbet',
  'Milkshake': 'Milkshake', 'Frozen Yogurt': 'Frozen Yogurt',
  'Smoothie Bowl': 'Smoothie Bowl', 'Frappé': 'Frappé', 'Frappe': 'Frappé',
  'Light Ice Cream': 'Light Ice Cream',
}

function migrateOfficial(markdown) {
  const firstSectionIdx = markdown.indexOf('## 🍨 Sección 1')
  if (firstSectionIdx === -1) throw new Error('No se encontró Sección 1')
  const body = markdown.slice(firstSectionIdx)
  const recipeBlocks = body.split(/(?=\n### \d+\. )/)

  let currentSectionNum = 1
  const sectionRecipes = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }

  for (const block of recipeBlocks) {
    for (let i = 1; i <= 6; i++) {
      if (block.includes(`Sección ${i} —`) || block.includes(`Sección ${i} —`)) {
        currentSectionNum = i
      }
    }

    const titleMatch = block.match(/^### (\d+)\.\s+(.+)/m)
    if (!titleMatch) continue

    const num = parseInt(titleMatch[1])
    const title = titleMatch[2].trim()

    const diffMatch = block.match(/\*\*👨‍🍳 Dificultad:\*\*\s*([^·\n·]+)/)
    const difficulty = diffMatch ? diffMatch[1].trim() : 'Media'

    const ninjaMetaMatch = block.match(/\*\*🎯 Ninja:\*\*\s*([^\n]+)/)
    const ninjaMeta = ninjaMetaMatch
      ? ninjaMetaMatch[1].trim()
      : (block.match(/Programa\s+\*\*([^*]+)\*\*/) || [])[1] || 'Ice Cream'
    const has_mixin = ninjaMeta.includes('Mix-In') ? 1 : 0
    let programRaw = ninjaMeta.replace(/\s*\+\s*Mix-In/i, '').replace(/[^\w\s\-éáíóú]/g, '').trim()
    const program = PROGRAM_MAP[programRaw] ?? programRaw

    const ingBlockMatch = block.match(/#### Ingredientes[^\n]*\n([\s\S]+?)(?=####|$)/)
    const ingText = ingBlockMatch ? ingBlockMatch[1].trim() : ''
    const ingredientGroups = ingText ? parseIngredients(ingText) : []

    const tm31BlockMatch = block.match(/#### Preparación en TM31\n([\s\S]+?)(?=####|$)/)
    let tm31Raw = tm31BlockMatch ? tm31BlockMatch[1].trim() : ''
    tm31Raw = tm31Raw
      .replace(/\s*Congela 24h en posición plana\.\s*/g, ' ')
      .replace(/\s*Programa\s+\*\*[^/*]+\*\*\.?/g, '')
      .replace(/\s*\*\*📝[^\n]*/g, '')
      .replace(/\n\n+/g, '\n')
      .trim()
    const tm31Steps = tm31Raw ? parseTm31Steps(tm31Raw) : []

    const ninjaBlockMatch = block.match(/#### En la Ninja CREAMi Deluxe\n([\s\S]+?)(?=####|\n---|\n### |$)/)
    let ninjaText = ninjaBlockMatch ? ninjaBlockMatch[1].trim() : ''
    ninjaText = ninjaText.replace(/\n\*\*📝[^\n]+\n?.*/s, '').trim()

    let ninjaSteps
    if (ninjaText) {
      ninjaSteps = parseNinjaSteps(ninjaText)
    } else {
      const tm31BlockText = (tm31BlockMatch || [])[1] || ''
      const templado = tm31BlockText.match(/Templa[^.]+\./)?.[0] || ''
      const fallback = `${templado ? templado + ' ' : ''}Programa **${program}**.`.trim()
      ninjaSteps = [{ title: null, description: fallback }]
    }

    const recipe = {
      num, title, program, difficulty,
      calories_per_serving: null,
      has_mixin, tags: [], source: 'Ninja oficial',
      notes: null, ingredientGroups, tm31Steps, ninjaSteps,
    }
    sectionRecipes[currentSectionNum].push(recipe)
  }

  const lines = ['# 📖 Recetario Ninja CREAMi Deluxe — Recetas Oficiales', '', '---', '']
  for (const [sectionNum, recipes] of Object.entries(sectionRecipes)) {
    if (recipes.length === 0) continue
    lines.push(`## ${SECTIONS_OFFICIAL[parseInt(sectionNum)]}`, '')
    for (const recipe of recipes) {
      lines.push(serializeRecipe(recipe, null))
      lines.push('')
      lines.push('---')
      lines.push('')
    }
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const md1 = readFileSync(join(ROOT, 'docs', 'recetario_helados_ninja.md'), 'utf-8')
const md2 = readFileSync(join(ROOT, 'docs', 'recetario_ninja_oficial.md'), 'utf-8')

console.log('🔄 Migrando recetario personal...')
const newMd1 = migratePersonal(md1)
writeFileSync(join(ROOT, 'docs', 'recetario_helados_ninja.md'), newMd1, 'utf-8')
console.log('✅ recetario_helados_ninja.md → formato canónico')

console.log('🔄 Migrando recetario oficial...')
const newMd2 = migrateOfficial(md2)
writeFileSync(join(ROOT, 'docs', 'recetario_ninja_oficial.md'), newMd2, 'utf-8')
console.log('✅ recetario_ninja_oficial.md → formato canónico')

console.log('\n🎉 Migración completada. Ahora ejecuta:')
console.log('   node scripts/reset.mjs && node scripts/seed-all.mjs')
