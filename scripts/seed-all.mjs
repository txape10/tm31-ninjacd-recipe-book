// @ts-check
// Seed completo — carga ambos recetarios en Turso.
// Formato de entrada: docs/SCHEMA.md define el esquema exacto.
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
const ADMIN_EMAIL = process.env.USER1_EMAIL || process.env.ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || ''
if (!ADMIN_EMAIL) {
  console.error('❌ Configura SEED_ADMIN_EMAIL (o USER1_EMAIL) en .env.local con el email del admin')
  process.exit(1)
}

const { rows: adminRows } = await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [ADMIN_EMAIL] })
if (!adminRows.length) {
  console.error(`❌ No existe un usuario con email "${ADMIN_EMAIL}" en la tabla users. Ejecuta primero seed-admin.mjs.`)
  process.exit(1)
}
const ADMIN_USER_ID = adminRows[0].id

function id() { return crypto.randomUUID() }

const usedSlugs = new Set()
function slugify(text) {
  let s = text.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
  if (!usedSlugs.has(s)) { usedSlugs.add(s); return s }
  let i = 2
  while (usedSlugs.has(`${s}-${i}`)) i++
  const unique = `${s}-${i}`
  usedSlugs.add(unique)
  return unique
}

// ---------------------------------------------------------------------------
// Parser unificado — lee el esquema definido en docs/SCHEMA.md
// ---------------------------------------------------------------------------

/**
 * Parsea un bloque de ingredientes en grupos { label, items }.
 * Formato: líneas "- item" agrupadas bajo "**Label:**" opcionales.
 */
function parseIngredients(text) {
  const groups = []
  let currentLabel = null
  let currentItems = []

  const pushGroup = () => {
    if (currentItems.length > 0) groups.push({ label: currentLabel, items: [...currentItems] })
  }

  for (const line of text.split('\n')) {
    const t = line.trim()
    if (!t) continue

    const labelMatch = t.match(/^\*\*(.+?):\*\*\s*$/)
    if (labelMatch) {
      pushGroup()
      currentLabel = labelMatch[1].trim()
      currentItems = []
      continue
    }

    if (t.startsWith('- ')) {
      currentItems.push(t.slice(2).trim())
    }
  }

  pushGroup()
  return groups
}

/**
 * Parsea el bloque de pasos en objetos { stepOrder, appliance, title, description }.
 * Formato: **Paso N — TM31|Ninja — Título**\nDescripción...
 */
function parseSteps(text) {
  const steps = []
  const blocks = text.split(/\n(?=\*\*Paso\s+\d+\s+—)/)

  for (const block of blocks) {
    const t = block.trim()
    if (!t) continue

    const headerMatch = t.match(/^\*\*Paso\s+(\d+)\s+—\s+(TM31|Ninja)\s+—\s+(.+?)\*\*/i)
    if (!headerMatch) continue

    const stepOrder = parseInt(headerMatch[1])
    const appliance = headerMatch[2].toLowerCase() === 'tm31' ? 'tm31' : 'ninja'
    const title = headerMatch[3].trim()
    const description = t.slice(headerMatch[0].length).replace(/^\n+/, '').trim()

    steps.push({ stepOrder, appliance, title, description })
  }

  return steps
}

/**
 * Extrae el texto de una sección #### hasta la siguiente #### o fin de bloque.
 */
function extractSection(text, heading) {
  const pattern = new RegExp(`#### ${heading}[^\\n]*\\n([\\s\\S]+?)(?=\\n####|$)`)
  const m = text.match(pattern)
  return m ? m[1].trim() : ''
}

const PROGRAM_ALIASES = {
  'Frappe': 'Frappé',
  'Smoothie bowl': 'Smoothie Bowl',
  'Frozen yogurt': 'Frozen Yogurt',
  'Light ice cream': 'Light Ice Cream',
  'Ice cream': 'Ice Cream',
}
function normalizeProgram(raw) {
  return PROGRAM_ALIASES[raw] ?? raw
}

/**
 * Parsea un único bloque de receta (entre dos ---).
 * Devuelve null si el bloque no contiene una receta válida.
 */
function parseRecipeBlock(block, currentSection, isPersonal) {
  const lines = block.split('\n')

  // Encontrar la cabecera ###
  const headerLine = lines.find(l => l.match(/^### /))
  if (!headerLine) return null

  let code = null
  let num = null
  let title = ''

  if (isPersonal) {
    const m = headerLine.match(/^### (\d+\.\d+)\s+·\s+(.+)/)
    if (!m) return null
    code = m[1]
    title = m[2].trim()
  } else {
    const m = headerLine.match(/^### (\d+)\.\s+(.+)/)
    if (!m) return null
    num = parseInt(m[1])
    title = m[2].trim()
  }

  // Metadatos
  const getMeta = (field) => {
    const m = block.match(new RegExp(`\\*\\*${field}:\\*\\*\\s*(.+)`))
    return m ? m[1].trim() : null
  }

  const programRaw = getMeta('Programa Ninja') || 'Ice Cream'
  const program = normalizeProgram(programRaw)
  const difficulty = getMeta('Dificultad') || 'Media'
  const calRaw = getMeta('Calorías\\/ración')
  const calories = calRaw && calRaw !== 'null' ? parseInt(calRaw) || null : null
  const mixInRaw = getMeta('Mix-In')
  const has_mixin = mixInRaw?.toLowerCase() === 'sí' ? 1 : 0
  const tagsRaw = getMeta('Tags')
  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : []
  const source = getMeta('Fuente')
  const notes = getMeta('Notas')

  // Ingredientes y pasos
  const ingText = extractSection(block, 'Ingredientes')
  const ingredientGroups = parseIngredients(ingText)

  const stepsText = extractSection(block, 'Pasos')
  const allSteps = parseSteps(stepsText)

  const tm31Steps = allSteps.filter(s => s.appliance === 'tm31')
    .map((s, i) => ({ ...s, stepOrder: i + 1 }))
  const ninjaSteps = allSteps.filter(s => s.appliance === 'ninja')
    .map((s, i) => ({ ...s, stepOrder: i + 1 }))

  // Validación
  const NO_TM31_PROGRAMS = ['Milkshake', 'Frappé', 'Smoothie Bowl']
  const warnings = []
  if (ingredientGroups.length === 0) warnings.push('sin ingredientes')
  if (tm31Steps.length === 0 && !NO_TM31_PROGRAMS.includes(program)) warnings.push('sin pasos TM31')
  if (ninjaSteps.length === 0) warnings.push('sin pasos Ninja')
  for (const s of tm31Steps) {
    if (!s.description || s.description.length < 10)
      warnings.push(`TM31 paso ${s.stepOrder} descripción corta`)
  }
  if (warnings.length > 0) {
    const id_ = isPersonal ? code : `#${num}`
    console.warn(`  ⛔ ${id_} "${title}": ${warnings.join(' | ')}`)
  }

  return {
    code,
    num,
    title,
    slug: slugify(title + (isPersonal ? '' : '-oficial')),
    section: currentSection,
    appliance: 'ninja-creami',
    program,
    difficulty,
    calories_per_serving: calories,
    has_mixin,
    tags,
    source: source ?? null,
    notes: notes ?? null,
    ingredientGroups,
    tm31Steps,
    ninjaSteps,
  }
}

/**
 * Parsea un archivo completo de recetas.
 * Extrae la sección activa de las cabeceras ## y divide por ---.
 */
function parseMarkdownFile(markdown, isPersonal) {
  const results = []
  let currentSection = ''

  // Dividir por líneas para rastrear secciones y bloques
  const blocks = markdown.split(/\n---\n/)

  for (const block of blocks) {
    // Detectar cambio de sección (## ) en este bloque
    const sectionMatches = [...block.matchAll(/^## (.+)/gm)]
    if (sectionMatches.length > 0) {
      // Usar el último encabezado de sección del bloque
      const header = sectionMatches[sectionMatches.length - 1][1]
      // Los archivos migrados ya usan nombres canónicos; solo eliminar emojis y espacios extra
      currentSection = header
        .replace(/[^\w\s\-áéíóúÁÉÍÓÚüÜñÑ]/gu, '')
        .trim()
    }

    const recipe = parseRecipeBlock(block, currentSection, isPersonal)
    if (recipe) results.push(recipe)
  }

  return results
}

// ---------------------------------------------------------------------------
// Inserción en BD
// ---------------------------------------------------------------------------
async function insertRecipes(recipes, label, createdBy) {
  const allTags = [...new Set(recipes.flatMap(r => r.tags))]
  for (const tagName of allTags) {
    await db.execute({ sql: 'INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)', args: [id(), tagName] })
  }
  const tagMap = new Map()
  for (const tagName of allTags) {
    const { rows } = await db.execute({ sql: 'SELECT id FROM tags WHERE name = ?', args: [tagName] })
    if (rows[0]) tagMap.set(tagName, rows[0].id)
  }

  let ok = 0
  for (const recipe of recipes) {
    const recipeId = id()

    await db.execute({
      sql: `INSERT INTO recipes
              (id, title, slug, section, appliance, program, difficulty,
               calories_per_serving, source, notes, has_mixin, is_public,
               user_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [
        recipeId, recipe.title, recipe.slug, recipe.section,
        recipe.appliance, recipe.program, recipe.difficulty,
        recipe.calories_per_serving ?? null,
        recipe.source, recipe.notes ?? null, recipe.has_mixin,
        1, createdBy,
      ],
    })

    for (let gi = 0; gi < recipe.ingredientGroups.length; gi++) {
      const group = recipe.ingredientGroups[gi]
      if (group.items.length === 0) continue
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

    for (const step of [...recipe.tm31Steps, ...recipe.ninjaSteps]) {
      await db.execute({
        sql: `INSERT INTO recipe_steps (id, recipe_id, appliance, step_order, title, description) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [id(), recipeId, step.appliance, step.stepOrder, step.title ?? null, step.description || ''],
      })
    }

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
    const codeStr = recipe.code ?? `#${recipe.num}`
    const calStr = recipe.calories_per_serving ? `, ~${recipe.calories_per_serving} kcal` : ''
    console.log(
      `  ✅ ${String(codeStr).padEnd(5)} · ${recipe.title.slice(0, 42).padEnd(42)} ` +
      `(${recipe.ingredientGroups.length}g/${ingCount}i · ${recipe.tm31Steps.length}TM31 · ${recipe.ninjaSteps.length}Ninja${calStr})`
    )
    ok++
  }

  console.log(`\n  📦 ${label}: ${ok} recetas insertadas.`)
  return ok
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function seed() {
  console.log('🌱 Iniciando seed completo (ambos recetarios)...\n')

  const md1 = readFileSync(join(__dirname, '..', 'docs', 'recetario_helados_ninja.md'), 'utf-8')
  const personal = parseMarkdownFile(md1, true)
  console.log(`📖 Recetario personal: ${personal.length} recetas parseadas\n`)
  const n1 = await insertRecipes(personal, 'Recetario personal', ADMIN_USER_ID)

  const md2 = readFileSync(join(__dirname, '..', 'docs', 'recetario_ninja_oficial.md'), 'utf-8')
  const official = parseMarkdownFile(md2, false)
  console.log(`\n📖 Recetario oficial: ${official.length} recetas parseadas\n`)
  const n2 = await insertRecipes(official, 'Recetario oficial', ADMIN_USER_ID)

  console.log(`\n🎉 Seed completado: ${n1} + ${n2} = ${n1 + n2} recetas totales.`)
}

seed().catch(err => { console.error('❌', err); process.exit(1) })
