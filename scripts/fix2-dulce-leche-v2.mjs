// @ts-check
// Fix 2: elimina Opción B (La Lechera) como grupo de ingredientes → pasa a nota.
//        Renumera paso TM31 step 6 → step 5.
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
  const { rows } = await db.execute({ sql: `SELECT id FROM recipes WHERE slug = 'helado-dulce-de-leche-haagen-dazs-v2'`, args: [] })
  const recipeId = rows[0].id

  // 1. Eliminar grupo Opción B y sus ingredientes
  const { rows: groupRows } = await db.execute({
    sql: `SELECT id FROM ingredient_groups WHERE recipe_id = ? AND label LIKE '%Opción B%'`,
    args: [recipeId],
  })
  for (const g of groupRows) {
    await db.execute({ sql: `DELETE FROM ingredients WHERE group_id = ?`, args: [g.id] })
    await db.execute({ sql: `DELETE FROM ingredient_groups WHERE id = ?`, args: [g.id] })
    console.log(`🗑️  Eliminado grupo Opción B`)
  }

  // 2. Renombrar grupo Opción A (quitar "Opción A: " del label para que sea la receta principal)
  await db.execute({
    sql: `UPDATE ingredient_groups SET label = 'Remolino de dulce de leche (casero)' WHERE recipe_id = ? AND label LIKE '%Opción A%'`,
    args: [recipeId],
  })
  console.log(`✏️  Renombrado grupo remolino → "Remolino de dulce de leche (casero)"`)

  // 3. Renumerar TM31 step 6 → step 5
  await db.execute({
    sql: `UPDATE recipe_steps SET step_order = 5 WHERE recipe_id = ? AND appliance = 'tm31' AND step_order = 6`,
    args: [recipeId],
  })
  console.log(`🔢 Renumerado TM31 step 6 → step 5`)

  // 4. Actualizar el título y descripción del paso 4 (remolino) para quitar "Opción A"
  await db.execute({
    sql: `UPDATE recipe_steps SET title = 'Remolino de dulce de leche casero' WHERE recipe_id = ? AND appliance = 'tm31' AND step_order = 4`,
    args: [recipeId],
  })
  console.log(`✏️  Actualizado título paso TM31 step 4`)

  // 5. Actualizar notes con ambas versiones sin restricciones
  await db.execute({
    sql: `UPDATE recipes SET notes = ? WHERE id = ?`,
    args: [
      'Versión revisada: bicarbonato activado en leche para el sabor tostado del dulce de leche, jarabe de glucosa opcional para más cremosidad, técnica de marmolado en zigzag. Corregidos: cubilete (no cestillo), tiempos de enfriado y templado. — Versión sin restricciones: para el remolino, sustituye por 3-4 cdas de dulce de leche comprado (La Lechera o similar, +~72 kcal/ración) o por dulce de leche casero con leche condensada azucarada (200 ml condensada + ¼ cdta bicarbonato + ½ cdta pectina, 35 min / 90°C / vel 2 / giro inverso): Maillard real, color y sabor intenso.',
      recipeId,
    ],
  })
  console.log(`✅ Notes actualizadas con ambas versiones sin restricciones`)

  console.log('\n🎉 Fix 2 completado.')
}

run().catch((err) => { console.error('❌', err); process.exit(1) })
