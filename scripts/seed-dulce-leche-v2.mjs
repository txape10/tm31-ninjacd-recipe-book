// @ts-check
// Script puntual: inserta la versión 2 revisada del helado de dulce de leche.
// Ejecutar: node scripts/seed-dulce-leche-v2.mjs
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

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

function id() {
  return crypto.randomUUID()
}

const recipeId = id()

const recipe = {
  id: recipeId,
  title: 'Helado de Dulce de Leche Häagen-Dazs (v2)',
  slug: 'helado-dulce-de-leche-haagen-dazs-v2',
  section: 'Häagen-Dazs',
  appliance: 'ninja-creami',
  program: 'Ice Cream',
  difficulty: 'Media-Alta',
  calories_per_serving: 411,
  rating: 9.0,
  source: 'Recetario Helados Ninja · Receta 1.3 (revisada) + receta de Julien',
  notes: 'Versión revisada: bicarbonato activado en leche para el sabor tostado del dulce de leche, jarabe de glucosa opcional para más cremosidad, y nueva Opción C con leche condensada + pectina (Maillard real). Corregidos: cubilete (no cestillo), tiempos de enfriado y templado, montaje con efecto marmolado.',
  has_mixin: 0,
  is_public: 1,
  tags: ['dulce-de-leche', 'clásico', 'caramelo'],
  groups: [
    {
      label: 'Base',
      items: [
        '220 ml nata para montar (35% MG)',
        '150 ml leche evaporada desnatada',
        '2 yemas de huevo',
        '60g eritritol',
        '5g extracto de vainilla (1 cdta)',
        '½ cdta bicarbonato de sodio + 1 cda leche entera (para activar)',
        'Opcional: 2 cdas jarabe de glucosa (mejora cremosidad y reduce cristalización)',
      ],
    },
    {
      label: 'Remolino — Opción A: casero ligero con eritritol',
      items: [
        '400 ml leche entera',
        '120g eritritol',
        '1 pizca de bicarbonato',
      ],
    },
    {
      label: 'Remolino — Opción B: comprado (recomendada para el día a día)',
      items: [
        '3-4 cdas de dulce de leche La Lechera o similar',
      ],
    },
    {
      label: 'Remolino — Opción C: casero auténtico con leche condensada (Maillard real)',
      items: [
        '200 ml leche condensada azucarada',
        '¼ cdta bicarbonato de sodio',
        '½ cdta pectina en polvo',
        '1 pizca de sal',
      ],
    },
  ],
  steps: [
    {
      appliance: 'tm31',
      step_order: 1,
      title: 'Activar el bicarbonato',
      description: 'En un vasito pequeño, disuelve el bicarbonato en 1 cda de leche entera y deja reposar 2 minutos. Este truco da a la base ese sabor ligeramente tostado tan característico del dulce de leche.',
    },
    {
      appliance: 'tm31',
      step_order: 2,
      title: 'Base',
      description: 'Añade al vaso la nata, la leche evaporada, las yemas, el eritritol, la vainilla y la mezcla de bicarbonato. Si usas jarabe de glucosa, añádelo también. Programa 8 min / 80°C / vel 3. Al terminar, pasa la espátula por el fondo para asegurarte de que no han quedado grumos de yema.',
    },
    {
      appliance: 'tm31',
      step_order: 3,
      title: 'Enfriar la base',
      description: 'Vierte la base en un bol y deja enfriar en la nevera al menos 2 horas. Si vas a hacer el remolino casero (Opción A o C), prepáralo ahora para que enfríe al mismo tiempo.',
    },
    {
      appliance: 'tm31',
      step_order: 4,
      title: 'Remolino Opción A — casero con eritritol',
      description: 'Leche entera, eritritol y una pizca de bicarbonato en el vaso. Cubilete puesto. Programa 40 min / 90°C / vel 2. El eritritol no hace Maillard, así que el color quedará en un dorado suave, no marrón. El bicarbonato evita que quede totalmente blanco. Deja enfriar completamente antes de montar.',
    },
    {
      appliance: 'tm31',
      step_order: 5,
      title: 'Remolino Opción C — casero auténtico (leche condensada)',
      description: 'Leche condensada, bicarbonato y sal en el vaso. Cubilete puesto. Programa 35 min / 90°C / vel 2 / giro inverso. El azúcar de la leche condensada sí carameliza — irás viendo cómo el color va oscureciendo. Cuando esté listo, espolvorea la pectina y mezcla 20 seg / vel 4 para incorporarla: esto evita que el remolino se diluya dentro del helado. Deja enfriar completamente.',
    },
    {
      appliance: 'tm31',
      step_order: 6,
      title: 'Montar y congelar',
      description: 'Cuando base y remolino estén completamente fríos: vierte la mitad de la base en la tarrina, añade 3-4 cdas de remolino en espiral sin mezclar del todo, y cubre con el resto de la base. Con un palillo o la punta de un cuchillo, haz un par de movimientos en zigzag para crear el efecto marmolado sin destruir las vetas. No superes la línea MAX. Cierra y congela 24 horas en posición plana.',
    },
    {
      appliance: 'ninja',
      step_order: 1,
      title: 'Templar y procesar',
      description: 'Saca la tarrina del congelador y déjala templar 2-3 minutos fuera. Monta en la máquina y ejecuta el programa Ice Cream.',
    },
    {
      appliance: 'ninja',
      step_order: 2,
      title: 'Re-Spin',
      description: 'Esta base tiene mucha grasa — casi seguro que necesitará Re-Spin. Haz un hueco en el centro, añade 2 cdas de nata fría y ejecuta Re-Spin.',
    },
    {
      appliance: 'ninja',
      step_order: 3,
      title: 'Servir',
      description: 'Opcional: sirve con un chorrito del remolino restante por encima para el efecto visual y de sabor.',
    },
  ],
}

async function run() {
  console.log('🌱 Insertando helado de dulce de leche v2...')

  // Tags (INSERT OR IGNORE por si ya existen)
  for (const tag of recipe.tags) {
    await db.execute({
      sql: 'INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)',
      args: [id(), tag],
    })
  }

  // Receta
  await db.execute({
    sql: `INSERT OR IGNORE INTO recipes
            (id, title, slug, section, appliance, program, difficulty,
             calories_per_serving, rating, source, notes, has_mixin,
             is_public, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      recipe.id, recipe.title, recipe.slug, recipe.section,
      recipe.appliance, recipe.program, recipe.difficulty,
      recipe.calories_per_serving, recipe.rating, recipe.source,
      recipe.notes, recipe.has_mixin, recipe.is_public, ADMIN_EMAIL,
    ],
  })

  // Tags de la receta
  for (const tagName of recipe.tags) {
    const { rows } = await db.execute({
      sql: 'SELECT id FROM tags WHERE name = ?',
      args: [tagName],
    })
    if (rows[0]) {
      await db.execute({
        sql: 'INSERT OR IGNORE INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)',
        args: [recipe.id, rows[0].id],
      })
    }
  }

  // Grupos de ingredientes
  for (let gi = 0; gi < recipe.groups.length; gi++) {
    const group = recipe.groups[gi]
    const groupId = id()
    await db.execute({
      sql: 'INSERT INTO ingredient_groups (id, recipe_id, label, position) VALUES (?, ?, ?, ?)',
      args: [groupId, recipe.id, group.label, gi],
    })
    for (let ii = 0; ii < group.items.length; ii++) {
      await db.execute({
        sql: 'INSERT INTO ingredients (id, group_id, text, position) VALUES (?, ?, ?, ?)',
        args: [id(), groupId, group.items[ii], ii],
      })
    }
  }

  // Pasos
  for (const step of recipe.steps) {
    await db.execute({
      sql: `INSERT INTO recipe_steps (id, recipe_id, appliance, step_order, title, description)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id(), recipe.id, step.appliance, step.step_order, step.title, step.description],
    })
  }

  console.log(`✅ Insertada: ${recipe.title}`)
  console.log(`🔗 Slug: /recetas/${recipe.slug}`)
  console.log('\n🎉 Listo. Ahora puedes comparar ambas versiones en la app.')
}

run().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
