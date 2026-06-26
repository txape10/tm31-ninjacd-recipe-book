// @ts-check
// Corrige la v2: elimina Opción C (leche condensada) como grupo de ingredientes
// y como paso TM31, y la mueve a la nota de la receta como "versión sin restricciones".
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

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

async function run() {
  // Obtener el id de la receta v2
  const { rows: recipeRows } = await db.execute({
    sql: `SELECT id FROM recipes WHERE slug = 'helado-dulce-de-leche-haagen-dazs-v2'`,
    args: [],
  })
  if (!recipeRows[0]) {
    console.error('❌ Receta v2 no encontrada.')
    process.exit(1)
  }
  const recipeId = recipeRows[0].id
  console.log(`🔍 Receta v2 encontrada: ${recipeId}`)

  // Eliminar grupo Opción C y sus ingredientes
  const { rows: groupRows } = await db.execute({
    sql: `SELECT id FROM ingredient_groups WHERE recipe_id = ? AND label LIKE '%Opción C%'`,
    args: [recipeId],
  })
  for (const g of groupRows) {
    await db.execute({ sql: `DELETE FROM ingredients WHERE group_id = ?`, args: [g.id] })
    await db.execute({ sql: `DELETE FROM ingredient_groups WHERE id = ?`, args: [g.id] })
    console.log(`🗑️  Eliminado grupo Opción C (id: ${g.id})`)
  }

  // Eliminar paso TM31 step_order 5 (Remolino Opción C)
  await db.execute({
    sql: `DELETE FROM recipe_steps WHERE recipe_id = ? AND appliance = 'tm31' AND step_order = 5`,
    args: [recipeId],
  })
  console.log(`🗑️  Eliminado paso TM31 step 5 (Opción C)`)

  // Actualizar notes con la versión sin restricciones
  await db.execute({
    sql: `UPDATE recipes SET notes = ? WHERE id = ?`,
    args: [
      'Versión revisada con bicarbonato activado en leche (sabor tostado del dulce de leche), jarabe de glucosa opcional para más cremosidad, y técnica de marmolado en zigzag. Corregidos: cubilete (no cestillo), tiempos de enfriado y templado. — Versión sin restricciones: sustituye eritritol por leche condensada azucarada en el remolino (200 ml condensada + ¼ cdta bicarbonato + ½ cdta pectina, 35 min / 90°C / vel 2 / giro inverso): Maillard real, color y sabor intenso, pero con azúcar.',
      recipeId,
    ],
  })
  console.log(`✅ Notes actualizadas con versión sin restricciones`)

  console.log('\n🎉 Receta v2 corregida.')
}

run().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
