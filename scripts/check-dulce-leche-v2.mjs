// @ts-check
import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

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

async function run() {
  const { rows: r } = await db.execute({ sql: `SELECT * FROM recipes WHERE slug = 'helado-dulce-de-leche-haagen-dazs-v2'`, args: [] })
  const recipe = r[0]
  console.log('\n=== RECETA ===')
  console.log(`title: ${recipe.title}`)
  console.log(`notes: ${recipe.notes}`)

  const { rows: groups } = await db.execute({ sql: `SELECT id, label, position FROM ingredient_groups WHERE recipe_id = ? ORDER BY position`, args: [recipe.id] })
  console.log('\n=== GRUPOS DE INGREDIENTES ===')
  for (const g of groups) {
    console.log(`[${g.position}] ${g.label}`)
    const { rows: items } = await db.execute({ sql: `SELECT text, position FROM ingredients WHERE group_id = ? ORDER BY position`, args: [g.id] })
    for (const i of items) console.log(`    - ${i.text}`)
  }

  const { rows: steps } = await db.execute({ sql: `SELECT appliance, step_order, title FROM recipe_steps WHERE recipe_id = ? ORDER BY appliance, step_order`, args: [recipe.id] })
  console.log('\n=== PASOS ===')
  for (const s of steps) console.log(`[${s.appliance} / step ${s.step_order}] ${s.title}`)
}

run().catch(console.error)
