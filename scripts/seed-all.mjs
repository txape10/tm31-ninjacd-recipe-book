// @ts-check
// Seed completo — carga ambos recetarios en Turso:
//   1. docs/recetario_helados_ninja.md  →  39 recetas personales
//   2. docs/recetario_ninja_oficial.md  → 131 recetas oficiales
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
const ADMIN_EMAIL = process.env.USER1_EMAIL || process.env.ADMIN_EMAIL || ''
if (!ADMIN_EMAIL) {
  console.error('❌ USER1_EMAIL no está configurado en .env.local')
  process.exit(1)
}
function id() { return crypto.randomUUID() }

// Registro global de slugs para deduplicación entre ambos ficheros
const usedSlugs = new Set()

function slugify(text) {
  let s = text.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')  // quitar acentos
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
// PIPELINE 1 — Recetario personal (39 recetas)
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

// Pre-registrar slugs del fichero personal para evitar colisiones con el oficial
for (const meta of Object.values(RECIPE_META)) usedSlugs.add(meta.slug)

const SECTIONS_PERSONAL = { 1: 'Häagen-Dazs', 2: 'Helados Clásicos', 3: 'Helados Especiales', 4: 'Sorbetes', 5: 'Batidos' }

function extractRecipeSection(markdown, code) {
  const escapedCode = code.replace(/\./g, '\\.')
  const pattern = new RegExp(`(### ${escapedCode} ·[\\s\\S]+?)(?=\\n### \\d+\\.\\d+ ·|\\n## |$)`)
  const m = markdown.match(pattern)
  return m ? m[1] : null
}

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

  // Stop at horizontal rule (---) — never spans section content
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

  const pushGroup = () => {
    if (currentItems.length > 0) groups.push({ label: currentLabel, items: currentItems })
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // **Label:** items inline (e.g. **Base:** 300 ml nata · 200 ml leche · ...)
    const inlineGroupMatch = trimmed.match(/^\*\*(.+?):\*\*\s+(.+)$/)
    if (inlineGroupMatch) {
      pushGroup()
      currentLabel = inlineGroupMatch[1].trim()
      const inlineItems = inlineGroupMatch[2]
      currentItems = inlineItems.includes(' · ')
        ? inlineItems.split(' · ').map(s => s.trim()).filter(Boolean)
        : [inlineItems.trim()]
      continue
    }

    // **Label:** or **Label** alone on a line
    const groupMatch = trimmed.match(/^\*\*(.+?)\*\*:?\s*$/) || trimmed.match(/^\*\*(.+?):\*\*\s*$/)
    if (groupMatch) {
      pushGroup()
      currentLabel = groupMatch[1].replace(/:$/, '').trim()
      currentItems = []
      continue
    }

    if (trimmed.startsWith('- ')) {
      const raw = trimmed.slice(2).trim()
      // Formato compacto con · como separador de ingredientes (sorbetes y batidos oficiales)
      if (raw.includes(' · ')) {
        currentItems.push(...raw.split(' · ').map(s => s.trim()).filter(Boolean))
      } else {
        currentItems.push(raw)
      }
    }
  }

  pushGroup()
  return groups
}

function parseTm31Steps(text) {
  if (!text.trim()) return []

  const hasNumberedSteps = /\*\*Paso\s+\d+\s+—/.test(text)

  if (!hasNumberedSteps) {
    // Formato libre (sin cabeceras **Paso N —**): paso único
    return [{ stepOrder: 1, title: null, description: text.trim() }]
  }

  const steps = []
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

function parseNinjaSteps(text) {
  if (!text.trim()) return []

  const lines = text.split('\n')
  const hasNumberedLines = lines.some(l => /^\d+\.\s+.+/.test(l.trim()))

  if (!hasNumberedLines) {
    // Formato libre o línea única: paso único sin título
    return [{ stepOrder: 1, title: null, description: text.trim() }]
  }

  const steps = []
  let stepOrder = 0

  for (const line of lines) {
    const trimmed = line.trim()
    const m = trimmed.match(/^(\d+)\.\s+(.+)$/)
    if (!m) continue

    stepOrder++
    const fullText = m[2].trim()

    const boldTitle = fullText.match(/^\*\*(.+?)\*\*[:\s]+(.*)$/)
    if (boldTitle) {
      steps.push({ stepOrder, title: boldTitle[1].trim(), description: boldTitle[2].trim() })
      continue
    }

    const dotIdx = fullText.indexOf('.')
    if (dotIdx > 0 && dotIdx < 80) {
      steps.push({ stepOrder, title: fullText.slice(0, dotIdx).trim(), description: fullText.slice(dotIdx + 1).trim() })
    } else {
      steps.push({ stepOrder, title: fullText.slice(0, 80).trim(), description: fullText.length > 80 ? fullText : '' })
    }
  }

  return steps
}

function extractCalories(text) {
  const m = text.match(/Por\s+ración[^|]*\|\s*\*?\*?~(\d+)\s*kcal/i)
  return m ? parseInt(m[1]) : null
}

function extractNotes(text) {
  const m = text.match(/\*\*Versión\s+sin\s+restricciones:\*\*\s*([\s\S]+?)(?:\n---|\n###|\n##|$)/)
  return m ? m[1].trim() : null
}

function parsePersonalMarkdown(markdown) {
  const codes = Object.keys(RECIPE_META)
  const results = []

  for (const code of codes) {
    const sectionBlock = extractRecipeSection(markdown, code)
    if (!sectionBlock) {
      console.warn(`⚠️  Receta ${code}: sección no encontrada en el markdown`)
      continue
    }

    const titleMatch = sectionBlock.match(/### \d+\.\d+ · (.+)/)
    const title = titleMatch ? titleMatch[1].trim() : `Receta ${code}`

    const diffMatch = sectionBlock.match(/Dificultad:\*\*\s*([^·\n*]+)/)
    const difficulty = diffMatch ? diffMatch[1].trim() : 'Media'

    const ratingMatch = sectionBlock.match(/Valoración:\s*([\d.]+)\/10/)
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null

    const ingText = extractH4Block(sectionBlock, 'Ingredientes', ['Preparación', 'Calorías', 'En la Ninja'])
    const ingredientGroups = parseIngredients(ingText)

    const tm31Text = extractH4Block(sectionBlock, 'Preparación en TM31', ['En la Ninja', 'Calorías'])
    const tm31Steps = parseTm31Steps(tm31Text)

    const ninjaText = extractH4Block(sectionBlock, 'En la Ninja CREAMi Deluxe', ['Calorías'])
    const ninjaSteps = parseNinjaSteps(ninjaText)

    const calText = extractH4Block(sectionBlock, 'Calorías', ['Versión', '---'])
    const calories = extractCalories(calText) || extractCalories(sectionBlock)

    const notes = extractNotes(sectionBlock)

    const sectionNum = parseInt(code.split('.')[0])
    const meta = RECIPE_META[code]

    results.push({
      code,
      title,
      slug: meta.slug,
      section: SECTIONS_PERSONAL[sectionNum],
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
// PIPELINE 2 — Recetario oficial (131 recetas)
// ---------------------------------------------------------------------------

const SECTIONS_OFFICIAL = {
  1: 'Helados Clásicos',
  2: 'Gelatos y Especiales',
  3: 'Veganos y Sin Lácteos',
  4: 'Sorbetes de Fruta',
  5: 'Sorbetes Especiales y con Alcohol',
  6: 'Batidos y Smoothie Bowls',
}

// Cabeceras de sección en el markdown oficial
const SECTION_HEADERS = [
  '🍨 Sección 1',
  '🍦 Sección 2',
  '🌱 Sección 3',
  '🧊 Sección 4',
  '🍸 Sección 5',
  '🥤 Sección 6',
]

function parseOfficialMarkdown(markdown) {
  // Localizar el inicio de la primera sección real (Sección 1)
  const firstSectionIdx = markdown.indexOf('## 🍨 Sección 1')
  if (firstSectionIdx === -1) throw new Error('No se encontró Sección 1 en el fichero oficial')
  const body = markdown.slice(firstSectionIdx)

  // Dividir en bloques de receta por "### N."
  const recipeBlocks = body.split(/(?=\n### \d+\. )/)

  // Rastrear sección actual
  let currentSectionNum = 1
  const results = []

  for (const block of recipeBlocks) {
    // ¿Cambio de sección?
    for (let i = 1; i <= 6; i++) {
      if (block.includes(`Sección ${i} —`) || block.includes(`Sección ${i} —`)) {
        currentSectionNum = i
      }
    }

    // ¿Es una receta?
    const titleMatch = block.match(/^### (\d+)\.\s+(.+)/m)
    if (!titleMatch) continue

    const recipeNum = parseInt(titleMatch[1])
    const title = titleMatch[2].trim()

    // Dificultad y programa
    const metaMatch = block.match(/\*\*👨‍🍳 Dificultad:\*\*\s*([^·\n·]+)/)
    const difficulty = metaMatch ? metaMatch[1].trim() : 'Media'

    const ninjaMetaMatch = block.match(/\*\*🎯 Ninja:\*\*\s*([^\n]+)/)
    // Si no hay campo Ninja, intentar extraerlo del texto TM31 ("Programa **X**")
    const ninjaMeta = ninjaMetaMatch
      ? ninjaMetaMatch[1].trim()
      : (block.match(/Programa\s+\*\*([^*]+)\*\*/) || [])[1] || 'Ice Cream'
    const has_mixin = ninjaMeta.includes('Mix-In') ? 1 : 0

    // Limpiar program (quitar "+ Mix-In" y emojis)
    let program = ninjaMeta.replace(/\s*\+\s*Mix-In/i, '').replace(/[^\w\s-éáíóú]/g, '').trim()
    // Normalizar nombres de programa
    const PROGRAM_MAP = {
      'Ice Cream': 'Ice Cream',
      'Gelato': 'Gelato',
      'Sorbet': 'Sorbet',
      'Milkshake': 'Milkshake',
      'Frozen Yogurt': 'Frozen Yogurt',
      'Smoothie Bowl': 'Smoothie Bowl',
      'Frappé': 'Frappé',
      'Frappe': 'Frappé',
      'Light Ice Cream': 'Light Ice Cream',
    }
    program = PROGRAM_MAP[program] ?? program

    // Ingredientes — soporta lista plana (- item), inline con · y grupos **Label:** items
    const ingBlockMatch = block.match(/#### Ingredientes[^\n]*\n([\s\S]+?)(?=####|$)/)
    const ingBlockText = ingBlockMatch ? ingBlockMatch[1].trim() : ''
    const ingredientGroups = ingBlockText ? parseIngredients(ingBlockText) : []

    // Pasos TM31 — texto completo como paso único
    const tm31BlockMatch = block.match(/#### Preparación en TM31\n([\s\S]+?)(?=####|$)/)
    let tm31Raw = tm31BlockMatch ? tm31BlockMatch[1].trim() : ''
    // Quitar "Congela 24h en posición plana. Programa **X**." — va al paso Ninja
    tm31Raw = tm31Raw
      .replace(/\s*Congela 24h en posición plana\.\s*/g, ' ')
      .replace(/\s*Programa\s+\*\*[^*]+\*\*\.?/g, '')
      .replace(/\s*\*\*📝[^\n]*/g, '')
      .trim()
    const tm31Text = tm31Raw.replace(/\n\n+/g, '\n').trim()
    const tm31Steps = tm31Text ? splitOfficialTm31Steps(tm31Text) : []

    // Pasos Ninja — texto completo como paso único
    const ninjaBlockMatch = block.match(/#### En la Ninja CREAMi Deluxe\n([\s\S]+?)(?=####|\n---|\n### |$)/)
    let ninjaText = ninjaBlockMatch ? ninjaBlockMatch[1].trim() : ''
    // Quitar la nota "📝 Sin azúcar"
    ninjaText = ninjaText.replace(/\n\*\*📝[^\n]+\n?.*/s, '').trim()

    // Para recetas sin sección Ninja propia (sorbetes compactos): extraer templado + programa del TM31
    let ninjaSteps
    if (ninjaText) {
      ninjaSteps = [{ stepOrder: 1, title: null, description: ninjaText }]
    } else {
      // Buscar en el texto TM31 la instrucción Ninja al final
      const tm31BlockText = (block.match(/#### Preparación en TM31\n([\s\S]+?)(?=####|$)/) || [])[1] || ''
      const templado = tm31BlockText.match(/Templa[^.]+\./)?.[0] || ''
      const prog = program || 'Sorbet'
      const fallbackNinja = `${templado ? templado + ' ' : ''}Programa **${prog}**.`.trim()
      ninjaSteps = [{ stepOrder: 1, title: null, description: fallbackNinja }]
    }

    // Slug
    const slug = slugify(`${title}-oficial`)

    results.push({
      num: recipeNum,
      title,
      slug,
      section: SECTIONS_OFFICIAL[currentSectionNum],
      appliance: 'ninja-creami',
      program,
      difficulty,
      rating: null,
      calories_per_serving: null,
      has_mixin,
      tags: [],
      source: 'ninja-oficial',
      notes: null,
      ingredientGroups,
      tm31Steps,
      ninjaSteps,
    })
  }

  return results
}

// Divide el bloque TM31 del fichero oficial en pasos numerados.
// Si el texto usa "**Título:**" como sub-cabecera, cada una es un paso.
// Si no, el bloque completo es un único paso.
function splitOfficialTm31Steps(text) {
  // Detectar sub-cabeceras tipo "**Infusión:**" o "**Crema:**"
  const subHeaders = [...text.matchAll(/^\*\*([^*]+):\*\*/gm)]
  if (subHeaders.length >= 2) {
    const steps = []
    const parts = text.split(/(?=^\*\*[^*]+:\*\*)/m)
    let order = 0
    for (const part of parts) {
      const trimmed = part.trim()
      if (!trimmed) continue
      order++
      const headerMatch = trimmed.match(/^\*\*([^*]+):\*\*\s*(.*)/)
      if (headerMatch) {
        steps.push({ stepOrder: order, title: headerMatch[1].trim(), description: headerMatch[2].trim() })
      } else {
        steps.push({ stepOrder: order, title: null, description: trimmed })
      }
    }
    return steps
  }

  // Sin sub-cabeceras: paso único
  return [{ stepOrder: 1, title: null, description: text }]
}

// ---------------------------------------------------------------------------
// Inserción genérica en BD
// ---------------------------------------------------------------------------
async function insertRecipes(recipes, label, createdBy) {
  // Recopilar tags únicos
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

    for (const step of recipe.tm31Steps) {
      await db.execute({
        sql: `INSERT INTO recipe_steps (id, recipe_id, appliance, step_order, title, description) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [id(), recipeId, 'tm31', step.stepOrder, step.title ?? null, step.description || ''],
      })
    }

    for (const step of recipe.ninjaSteps) {
      await db.execute({
        sql: `INSERT INTO recipe_steps (id, recipe_id, appliance, step_order, title, description) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [id(), recipeId, 'ninja', step.stepOrder, step.title ?? null, step.description || ''],
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
    const calStr = recipe.calories_per_serving ? `, ~${recipe.calories_per_serving} kcal` : ''
    const warn = recipe.ninjaSteps.length === 0 || recipe.ingredientGroups.length === 0 ? ' ⚠️' : ''
    if (warn) warnings++

    const codeStr = recipe.code ?? `#${recipe.num}`
    console.log(
      `  ✅ ${codeStr.padEnd(5)} · ${recipe.title.slice(0, 42).padEnd(42)} ` +
      `(${recipe.ingredientGroups.length}g/${ingCount}i · ${recipe.tm31Steps.length}TM31 · ${recipe.ninjaSteps.length}Ninja${calStr})${warn}`
    )

    ok++
  }

  console.log(`\n  📦 ${label}: ${ok} recetas insertadas${warnings ? `, ${warnings} con advertencias ⚠️` : ''}.`)
  return ok
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function seed() {
  console.log('🌱 Iniciando seed completo (ambos recetarios)...\n')

  // — Fichero 1: recetario personal —
  console.log('📖 Fichero 1 — Recetario personal (recetario_helados_ninja.md)')
  const md1 = readFileSync(join(__dirname, '..', 'docs', 'recetario_helados_ninja.md'), 'utf-8')
  const personal = parsePersonalMarkdown(md1)
  console.log(`   Parseadas: ${personal.length} recetas\n`)
  const n1 = await insertRecipes(personal, 'Recetario personal', ADMIN_EMAIL)

  // — Fichero 2: recetario oficial —
  console.log('\n📖 Fichero 2 — Recetario oficial (recetario_ninja_oficial.md)')
  const md2 = readFileSync(join(__dirname, '..', 'docs', 'recetario_ninja_oficial.md'), 'utf-8')
  const official = parseOfficialMarkdown(md2)
  console.log(`   Parseadas: ${official.length} recetas\n`)
  const n2 = await insertRecipes(official, 'Recetario oficial', ADMIN_EMAIL)

  console.log(`\n🎉 Seed completado: ${n1} + ${n2} = ${n1 + n2} recetas totales.`)
}

seed().catch(err => { console.error('❌', err); process.exit(1) })
