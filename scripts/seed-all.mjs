// @ts-check
// Seed completo — lee docs/recetario_helados_ninja.md y carga las 39 recetas en Turso.
// Ejecutar después de reset.mjs.

import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))

const envPath = join(__dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const [key, ...rest] = trimmed.split('=')
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
}

const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''
function id() { return crypto.randomUUID() }

// ---------------------------------------------------------------------------
// Metadatos que no están en el markdown (slug, program, has_mixin, tags)
// ---------------------------------------------------------------------------
const RECIPE_META = {
  '1.1': { slug: 'helado-chocolate-belga-haagen-dazs',        program: 'Ice Cream',  has_mixin: 1, tags: ['chocolate', 'clásico'] },
  '1.2': { slug: 'helado-galletas-crema-haagen-dazs',         program: 'Ice Cream',  has_mixin: 1, tags: ['galletas', 'vainilla', 'clásico'] },
  '1.3': { slug: 'helado-dulce-de-leche-haagen-dazs',         program: 'Ice Cream',  has_mixin: 0, tags: ['dulce-de-leche', 'caramelo'] },
  '1.4': { slug: 'helado-brownie-vainilla-caramelo-haagen-dazs', program: 'Ice Cream', has_mixin: 1, tags: ['chocolate', 'brownie', 'caramelo'] },
  '1.5': { slug: 'helado-peanut-butter-crunch-haagen-dazs',   program: 'Ice Cream',  has_mixin: 1, tags: ['cacahuete', 'clásico'] },
  '1.6': { slug: 'helado-macadamia-haagen-dazs',              program: 'Ice Cream',  has_mixin: 1, tags: ['frutos-secos', 'caramelo'] },
  '2.1': { slug: 'helado-vainilla-sin-azucar',                program: 'Ice Cream',  has_mixin: 0, tags: ['vainilla', 'clásico', 'sin-gluten'] },
  '2.2': { slug: 'helado-pistacho',                           program: 'Ice Cream',  has_mixin: 0, tags: ['pistacho', 'frutos-secos'] },
  '2.3': { slug: 'helado-chocolate-puro-sin-azucar',          program: 'Ice Cream',  has_mixin: 0, tags: ['chocolate', 'clásico', 'sin-gluten'] },
  '2.4': { slug: 'helado-chocolate-con-leche',                program: 'Ice Cream',  has_mixin: 0, tags: ['chocolate', 'clásico'] },
  '2.5': { slug: 'helado-chocolate-blanco',                   program: 'Ice Cream',  has_mixin: 0, tags: ['chocolate-blanco'] },
  '2.6': { slug: 'helado-cafe',                               program: 'Ice Cream',  has_mixin: 0, tags: ['café', 'clásico'] },
  '2.7': { slug: 'helado-dulce-de-leche-rapido',              program: 'Ice Cream',  has_mixin: 0, tags: ['dulce-de-leche', 'caramelo', 'rápido'] },
  '2.8': { slug: 'helado-leche-merengada',                    program: 'Ice Cream',  has_mixin: 0, tags: ['limón', 'canela', 'clásico'] },
  '2.9': { slug: 'helado-lemon-pie',                          program: 'Ice Cream',  has_mixin: 1, tags: ['limón', 'galletas'] },
  '2.10': { slug: 'helado-turron-jijona',                     program: 'Ice Cream',  has_mixin: 0, tags: ['turrón', 'navidad', 'frutos-secos'] },
  '2.11': { slug: 'helado-petit-beurre',                      program: 'Ice Cream',  has_mixin: 0, tags: ['galletas', 'mantequilla'] },
  '2.12': { slug: 'helado-cereza',                            program: 'Ice Cream',  has_mixin: 0, tags: ['fruta', 'cereza'] },
  '2.13': { slug: 'helado-fresas-tagada',                     program: 'Ice Cream',  has_mixin: 0, tags: ['fruta', 'fresa', 'chuche'] },
  '2.14': { slug: 'helado-oreo',                              program: 'Ice Cream',  has_mixin: 1, tags: ['galletas', 'chocolate', 'oreo'] },
  '2.15': { slug: 'helado-algodon-azucar-caramelo',           program: 'Ice Cream',  has_mixin: 0, tags: ['caramelo', 'chuche'] },
  '2.16': { slug: 'helado-cheesecake',                        program: 'Ice Cream',  has_mixin: 1, tags: ['cheesecake', 'galletas'] },
  '3.1': { slug: 'helado-chicle',                             program: 'Ice Cream',  has_mixin: 0, tags: ['chuche', 'chicle'] },
  '3.2': { slug: 'helado-selva-negra',                        program: 'Ice Cream',  has_mixin: 1, tags: ['chocolate', 'cereza', 'especial'] },
  '3.3': { slug: 'helado-chocolate-dubai',                    program: 'Ice Cream',  has_mixin: 1, tags: ['chocolate', 'especial', 'viral'] },
  '3.4': { slug: 'helado-chocolate-fresa',                    program: 'Ice Cream',  has_mixin: 0, tags: ['chocolate', 'fresa'] },
  '3.5': { slug: 'helado-kinder-bueno-white',                 program: 'Ice Cream',  has_mixin: 1, tags: ['chocolate-blanco', 'avellana', 'especial'] },
  '3.6': { slug: 'helado-tiramisu',                           program: 'Ice Cream',  has_mixin: 0, tags: ['café', 'mascarpone', 'especial'] },
  '3.7': { slug: 'helado-caramelo-beurre-sale',               program: 'Ice Cream',  has_mixin: 0, tags: ['caramelo', 'mantequilla', 'especial'] },
  '3.8': { slug: 'helado-jengibre-especias',                  program: 'Ice Cream',  has_mixin: 0, tags: ['jengibre', 'especias'] },
  '4.1': { slug: 'sorbete-mandarina',                         program: 'Sorbet',     has_mixin: 0, tags: ['sorbete', 'fruta', 'vegano', 'sin-lácteos'] },
  '4.2': { slug: 'sorbete-naranja',                           program: 'Sorbet',     has_mixin: 0, tags: ['sorbete', 'fruta', 'vegano', 'sin-lácteos'] },
  '4.3': { slug: 'sorbete-pina',                              program: 'Sorbet',     has_mixin: 0, tags: ['sorbete', 'fruta', 'vegano', 'sin-lácteos'] },
  '5.1': { slug: 'batido-vainilla',                           program: 'Milkshake',  has_mixin: 0, tags: ['batido', 'vainilla'] },
  '5.2': { slug: 'batido-chocolate-intenso',                  program: 'Milkshake',  has_mixin: 0, tags: ['batido', 'chocolate'] },
  '5.3': { slug: 'batido-cafe-caramelo',                      program: 'Milkshake',  has_mixin: 0, tags: ['batido', 'café', 'caramelo'] },
  '5.4': { slug: 'batido-pistacho',                           program: 'Milkshake',  has_mixin: 0, tags: ['batido', 'pistacho', 'frutos-secos'] },
  '5.5': { slug: 'frappe-vainilla-canela',                    program: 'Frappé',     has_mixin: 0, tags: ['frappé', 'vainilla', 'canela'] },
  '5.6': { slug: 'frappe-cafe',                               program: 'Frappé',     has_mixin: 0, tags: ['frappé', 'café'] },
}

const SECTIONS = { 1: 'Häagen-Dazs', 2: 'Helados Clásicos', 3: 'Helados Especiales', 4: 'Sorbetes', 5: 'Batidos' }

// ---------------------------------------------------------------------------
// Extrae el bloque de texto de una receta por código (ej. "2.10")
// ---------------------------------------------------------------------------
function extractRecipeSection(markdown, code) {
  // Escapa el punto para usar en regex
  const escapedCode = code.replace(/\./g, '\\.')
  // Captura desde "### X.Y ·" hasta el siguiente "### " o "## "
  const pattern = new RegExp(`(### ${escapedCode} ·[\\s\\S]+?)(?=\\n### \\d+\\.\\d+ ·|\\n## |$)`)
  const m = markdown.match(pattern)
  return m ? m[1] : null
}

// ---------------------------------------------------------------------------
// Extrae el contenido entre dos encabezados ####
// startHeader es texto parcial (ej. "Ingredientes" matchea "#### Ingredientes (1 tarrina...)")
// ---------------------------------------------------------------------------
function extractH4Block(sectionText, startHeader, endHeaders) {
  // Localiza el inicio del bloque
  const startPattern = new RegExp(`#### ${startHeader}[^\n]*\n`)
  const startMatch = sectionText.match(startPattern)
  if (!startMatch) return ''

  const startIdx = startMatch.index + startMatch[0].length
  let endIdx = sectionText.length

  // Localiza el primero de los endHeaders que aparezca después del inicio
  for (const endH of endHeaders) {
    const endPattern = new RegExp(`#### ${endH}`)
    const endMatch = sectionText.slice(startIdx).match(endPattern)
    if (endMatch) {
      const candidate = startIdx + endMatch.index
      if (candidate < endIdx) endIdx = candidate
    }
  }

  return sectionText.slice(startIdx, endIdx).trim()
}

// ---------------------------------------------------------------------------
// Parser de grupos de ingredientes
// ---------------------------------------------------------------------------
function parseIngredients(text) {
  const groups = []
  const lines = text.split('\n')
  let currentLabel = null
  let currentItems = []

  const pushGroup = () => {
    if (currentItems.length > 0) {
      groups.push({ label: currentLabel, items: currentItems })
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Encabezado de grupo: **Texto:** (con o sin paréntesis al final)
    const groupMatch = trimmed.match(/^\*\*(.+?)\*\*:?\s*$/) || trimmed.match(/^\*\*(.+?):\*\*\s*$/)
    if (groupMatch) {
      pushGroup()
      currentLabel = groupMatch[1].replace(/:$/, '').trim()
      currentItems = []
      continue
    }

    // Ingrediente: línea que empieza con "- "
    if (trimmed.startsWith('- ')) {
      currentItems.push(trimmed.slice(2).trim())
    }
  }

  pushGroup()
  return groups
}

// ---------------------------------------------------------------------------
// Parser de pasos TM31
// Formato: **Paso N — Título**
// Descripción en líneas siguientes hasta el próximo **Paso o fin de bloque
// ---------------------------------------------------------------------------
function parseTm31Steps(text) {
  const steps = []
  // Divide por cada "**Paso N —" manteniendo el delimitador
  const blocks = text.split(/(?=\*\*Paso\s+\d+\s+—)/)

  for (const block of blocks) {
    const titleMatch = block.match(/^\*\*Paso\s+(\d+)\s+—\s+(.+?)\*\*/)
    if (!titleMatch) continue

    const stepOrder = parseInt(titleMatch[1])
    const title = titleMatch[2].trim()
    const description = block.slice(titleMatch[0].length).replace(/^\n+/, '').trim()

    steps.push({ stepOrder, title, description })
  }

  return steps
}

// ---------------------------------------------------------------------------
// Parser de pasos Ninja (lista numerada)
// ---------------------------------------------------------------------------
function parseNinjaSteps(text) {
  const steps = []
  const lines = text.split('\n')
  let stepOrder = 0

  for (const line of lines) {
    const trimmed = line.trim()
    // Línea numerada: "1. texto..." o "1. **Título:** texto"
    const m = trimmed.match(/^(\d+)\.\s+(.+)$/)
    if (!m) continue

    stepOrder++
    const fullText = m[2].trim()

    // Intenta separar título en negrita del resto: **Título:** descripción
    const boldTitle = fullText.match(/^\*\*(.+?)\*\*[:\s]+(.*)$/)
    if (boldTitle) {
      steps.push({ stepOrder, title: boldTitle[1].trim(), description: boldTitle[2].trim() })
      continue
    }

    // Sin negrita: primera frase como título, resto como descripción
    const dotIdx = fullText.indexOf('.')
    if (dotIdx > 0 && dotIdx < 80) {
      steps.push({
        stepOrder,
        title: fullText.slice(0, dotIdx).trim(),
        description: fullText.slice(dotIdx + 1).trim(),
      })
    } else {
      steps.push({ stepOrder, title: fullText.slice(0, 80).trim(), description: fullText.length > 80 ? fullText : '' })
    }
  }

  return steps
}

// ---------------------------------------------------------------------------
// Extrae calorías por ración de la tabla
// ---------------------------------------------------------------------------
function extractCalories(text) {
  // Busca "Por ración (÷N)" con ~NNN kcal
  const m = text.match(/Por\s+ración[^|]*\|\s*\*?\*?~(\d+)\s*kcal/i)
  return m ? parseInt(m[1]) : null
}

// ---------------------------------------------------------------------------
// Extrae notas (Versión sin restricciones)
// ---------------------------------------------------------------------------
function extractNotes(text) {
  const m = text.match(/\*\*Versión\s+sin\s+restricciones:\*\*\s*([\s\S]+?)(?:\n---|\n###|\n##|$)/)
  return m ? m[1].trim() : null
}

// ---------------------------------------------------------------------------
// Parser principal del markdown
// ---------------------------------------------------------------------------
function parseMarkdown(markdown) {
  const codes = Object.keys(RECIPE_META)
  const results = []

  for (const code of codes) {
    const sectionBlock = extractRecipeSection(markdown, code)
    if (!sectionBlock) {
      console.warn(`⚠️  Receta ${code}: sección no encontrada en el markdown`)
      continue
    }

    // Título
    const titleMatch = sectionBlock.match(/### \d+\.\d+ · (.+)/)
    const title = titleMatch ? titleMatch[1].trim() : `Receta ${code}`

    // Dificultad
    const diffMatch = sectionBlock.match(/Dificultad:\*\*\s*([^·\n*]+)/)
    const difficulty = diffMatch ? diffMatch[1].trim() : 'Media'

    // Valoración
    const ratingMatch = sectionBlock.match(/Valoración:\s*([\d.]+)\/10/)
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null

    // Ingredientes
    const ingText = extractH4Block(sectionBlock, 'Ingredientes', ['Preparación', 'Calorías', 'En la Ninja'])
    const ingredientGroups = parseIngredients(ingText)

    // Pasos TM31
    const tm31Text = extractH4Block(sectionBlock, 'Preparación en TM31', ['En la Ninja', 'Calorías'])
    const tm31Steps = parseTm31Steps(tm31Text)

    // Pasos Ninja
    const ninjaText = extractH4Block(sectionBlock, 'En la Ninja CREAMi Deluxe', ['Calorías'])
    const ninjaSteps = parseNinjaSteps(ninjaText)

    // Calorías
    const calText = extractH4Block(sectionBlock, 'Calorías', ['Versión', '---'])
    const calories = extractCalories(calText) || extractCalories(sectionBlock)

    // Notas
    const notes = extractNotes(sectionBlock)

    const sectionNum = parseInt(code.split('.')[0])
    const meta = RECIPE_META[code]

    results.push({
      code,
      title,
      slug: meta.slug,
      section: SECTIONS[sectionNum],
      appliance: 'ninja-creami',
      program: meta.program,
      difficulty,
      rating,
      calories_per_serving: calories,
      has_mixin: meta.has_mixin,
      tags: meta.tags,
      source: `Recetario Helados Ninja · Receta ${code}`,
      notes,
      ingredientGroups,
      tm31Steps,
      ninjaSteps,
    })
  }

  return results
}

// ---------------------------------------------------------------------------
// Inserción en BD
// ---------------------------------------------------------------------------
async function seed() {
  console.log('🌱 Iniciando seed completo...\n')

  const mdPath = join(__dirname, '..', 'docs', 'recetario_helados_ninja.md')
  const markdown = readFileSync(mdPath, 'utf-8')

  const recipes = parseMarkdown(markdown)
  console.log(`📖 Recetas parseadas: ${recipes.length}\n`)

  // Tags únicos
  const allTags = [...new Set(recipes.flatMap(r => r.tags))]
  for (const tagName of allTags) {
    await db.execute({ sql: 'INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)', args: [id(), tagName] })
  }
  // Cargar IDs de tags (pueden existir del seed anterior)
  const tagMap = new Map()
  for (const tagName of allTags) {
    const { rows } = await db.execute({ sql: 'SELECT id FROM tags WHERE name = ?', args: [tagName] })
    if (rows[0]) tagMap.set(tagName, rows[0].id)
  }

  let ok = 0
  let warnings = 0

  for (const recipe of recipes) {
    const recipeId = id()

    await db.execute({
      sql: `INSERT INTO recipes
              (id, title, slug, section, appliance, program, difficulty,
               calories_per_serving, rating, source, notes, has_mixin,
               is_public, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        recipeId, recipe.title, recipe.slug, recipe.section,
        recipe.appliance, recipe.program, recipe.difficulty,
        recipe.calories_per_serving ?? null, recipe.rating ?? null,
        recipe.source, recipe.notes ?? null, recipe.has_mixin,
        1, ADMIN_EMAIL,
      ],
    })

    // Grupos de ingredientes
    for (let gi = 0; gi < recipe.ingredientGroups.length; gi++) {
      const group = recipe.ingredientGroups[gi]
      const groupId = id()
      await db.execute({
        sql: 'INSERT INTO ingredient_groups (id, recipe_id, label, position) VALUES (?, ?, ?, ?)',
        args: [groupId, recipeId, group.label ?? null, gi],
      })
      for (let ii = 0; ii < group.items.length; ii++) {
        await db.execute({
          sql: 'INSERT INTO ingredients (id, group_id, text, position) VALUES (?, ?, ?, ?)',
          args: [id(), groupId, group.items[ii], ii],
        })
      }
    }

    // Pasos TM31
    for (const step of recipe.tm31Steps) {
      await db.execute({
        sql: `INSERT INTO recipe_steps (id, recipe_id, appliance, step_order, title, description) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [id(), recipeId, 'tm31', step.stepOrder, step.title, step.description || ''],
      })
    }

    // Pasos Ninja
    for (const step of recipe.ninjaSteps) {
      await db.execute({
        sql: `INSERT INTO recipe_steps (id, recipe_id, appliance, step_order, title, description) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [id(), recipeId, 'ninja', step.stepOrder, step.title, step.description || ''],
      })
    }

    // Tags
    for (const tag of recipe.tags) {
      const tagId = tagMap.get(tag)
      if (tagId) {
        await db.execute({
          sql: 'INSERT OR IGNORE INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)',
          args: [recipeId, tagId],
        })
      }
    }

    const ingCount = recipe.ingredientGroups.reduce((s, g) => s + g.items.length, 0)
    const calStr = recipe.calories_per_serving ? `, ~${recipe.calories_per_serving} kcal` : ''
    const warn = recipe.tm31Steps.length === 0 || recipe.ninjaSteps.length === 0 ? ' ⚠️' : ''
    if (warn) warnings++

    console.log(
      `✅ ${recipe.code} · ${recipe.title.slice(0, 45).padEnd(45)} ` +
      `(${recipe.ingredientGroups.length}g/${ingCount}i · ${recipe.tm31Steps.length}TM31 · ${recipe.ninjaSteps.length}Ninja${calStr})${warn}`
    )

    ok++
  }

  console.log(`\n🎉 Seed completado: ${ok} recetas insertadas${warnings ? `, ${warnings} con advertencias ⚠️` : ''}.`)
}

seed().catch(err => { console.error('❌', err); process.exit(1) })
