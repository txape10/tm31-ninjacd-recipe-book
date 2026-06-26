// @ts-check
// Fix 3: sustituye jarabe de glucosa por xantana en la base de la v2.
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

  // Sustituir el ingrediente de glucosa por xantana
  await db.execute({
    sql: `UPDATE ingredients SET text = '0.2g xantana (1 pizca generosa, evita cristalización)'
          WHERE group_id IN (SELECT id FROM ingredient_groups WHERE recipe_id = ? AND label = 'Base')
          AND text LIKE '%jarabe de glucosa%'`,
    args: [recipeId],
  })
  console.log(`✏️  Glucosa → xantana en ingredientes`)

  // Actualizar descripción del paso 2 (Base) para reflejar el cambio
  await db.execute({
    sql: `UPDATE recipe_steps SET description = ?
          WHERE recipe_id = ? AND appliance = 'tm31' AND step_order = 2`,
    args: [
      'Añade al vaso la nata, la leche evaporada, las yemas, el eritritol, la vainilla y la mezcla de bicarbonato. Programa 8 min / 80°C / vel 3. Al terminar, añade la xantana y mezcla 15 seg / vel 6 para integrarla bien. Pasa la espátula por el fondo para asegurarte de que no han quedado grumos de yema.',
      recipeId,
    ],
  })
  console.log(`✏️  Actualizado paso TM31 step 2 con instrucción de xantana`)

  // Actualizar notes — quitar mención a jarabe de glucosa
  await db.execute({
    sql: `UPDATE recipes SET notes = ? WHERE id = ?`,
    args: [
      'Versión revisada: bicarbonato activado en leche para el sabor tostado del dulce de leche, xantana en lugar de jarabe de glucosa (mismo efecto anti-cristalización, sin calorías), técnica de marmolado en zigzag. Corregidos: cubilete (no cestillo), tiempos de enfriado y templado. — Versión sin restricciones: para el remolino, sustituye por 3-4 cdas de dulce de leche comprado (La Lechera o similar, +~72 kcal/ración) o por dulce de leche casero con leche condensada azucarada (200 ml condensada + ¼ cdta bicarbonato + ½ cdta pectina, 35 min / 90°C / vel 2 / giro inverso): Maillard real, color y sabor intenso.',
      recipeId,
    ],
  })
  console.log(`✅ Notes actualizadas`)

  console.log('\n🎉 Fix 3 completado.')
}

run().catch((err) => { console.error('❌', err); process.exit(1) })
