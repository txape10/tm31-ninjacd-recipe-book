// @ts-check
import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Leer .env.local manualmente
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

const recipes = [
  {
    id: id(),
    title: 'Helado de Chocolate Belga al estilo Häagen-Dazs',
    slug: 'helado-chocolate-belga-haagen-dazs',
    section: 'Häagen-Dazs',
    appliance: 'ninja-creami',
    program: 'Ice Cream',
    difficulty: 'Media',
    calories_per_serving: 518,
    rating: 10.0,
    source: 'Recetario Helados Ninja · Receta 1.1',
    notes: 'El más cercano al original. Chocolate belga 72% + cacao en doble dosis, yemas y nata. Resultado espectacular. Re-Spin casi siempre necesario.',
    has_mixin: 1,
    is_public: 1,
    tags: ['chocolate', 'clásico', 'sin-gluten'],
    groups: [
      {
        label: 'Base',
        items: [
          '200 ml nata para montar (35% MG)',
          '150 ml leche evaporada desnatada',
          '2 yemas de huevo',
          '60g chocolate belga ≥72%',
          '20g cacao puro desgrasado',
          '60g eritritol',
          '5g extracto de vainilla (1 cdta)',
          '1g sal (1 pizca)',
        ],
      },
      {
        label: 'Mix-In (opcional)',
        items: [
          '40g virutas de chocolate negro',
          '1 cdta aceite de coco (o mantequilla)',
        ],
      },
    ],
    steps: [
      {
        appliance: 'tm31',
        step_order: 1,
        title: 'Fundir el chocolate',
        description: 'Trocea el chocolate. Vierte en el vaso y programa 3 min / 50°C / vel 2 hasta fundido. Reserva.',
      },
      {
        appliance: 'tm31',
        step_order: 2,
        title: 'Base de crema inglesa',
        description: 'Sin limpiar el vaso: añade nata, leche evaporada, yemas, cacao, eritritol, vainilla y sal. Programa 8 min / 80°C / vel 3. Añade el chocolate fundido y mezcla 20 seg / vel 4.',
      },
      {
        appliance: 'tm31',
        step_order: 3,
        title: 'Enfriar y congelar',
        description: 'Enfría en nevera mínimo 2 horas. Rellena la tarrina hasta la línea MAX y congela 24h en posición plana.',
      },
      {
        appliance: 'ninja',
        step_order: 1,
        title: 'Procesar',
        description: 'Templa 2 min fuera del congelador. Programa Ice Cream.',
      },
      {
        appliance: 'ninja',
        step_order: 2,
        title: 'Re-Spin',
        description: 'Haz un hueco en el centro, añade 1-2 cdas de nata fría y ejecuta Re-Spin.',
      },
      {
        appliance: 'ninja',
        step_order: 3,
        title: 'Mix-In',
        description: 'Añade las virutas de chocolate bien frías y ejecuta el programa Mix-In.',
      },
    ],
  },
  {
    id: id(),
    title: 'Helado de Galletas y Crema al estilo Häagen-Dazs',
    slug: 'helado-galletas-crema-haagen-dazs',
    section: 'Häagen-Dazs',
    appliance: 'ninja-creami',
    program: 'Ice Cream',
    difficulty: 'Media',
    calories_per_serving: 488,
    rating: 9.0,
    source: 'Recetario Helados Ninja · Receta 1.2',
    notes: 'Base de vainilla pura con galletas tipo Oreo troceadas. Fidelísimo al original. Las Oreos trituradas en la base son opcionales pero marcan la diferencia.',
    has_mixin: 1,
    is_public: 1,
    tags: ['galletas', 'vainilla', 'clásico'],
    groups: [
      {
        label: 'Base de vainilla',
        items: [
          '220 ml nata para montar (35% MG)',
          '180 ml leche evaporada desnatada',
          '2 yemas de huevo',
          '70g eritritol',
          '7g extracto de vainilla pura (1½ cdta)',
          '1g sal (1 pizca)',
        ],
      },
      {
        label: 'Mix-In',
        items: [
          '80g galletas Oreo originales troceadas gruesas',
          '2 Oreos extra trituradas finas para la base (opcional)',
        ],
      },
    ],
    steps: [
      {
        appliance: 'tm31',
        step_order: 1,
        title: 'Base de vainilla',
        description: 'Todos los ingredientes de la base en el vaso. Programa 8 min / 80°C / vel 3.',
      },
      {
        appliance: 'tm31',
        step_order: 2,
        title: 'Galletas en la base (opcional)',
        description: 'Deja enfriar a 40°C. Añade las 2 Oreos trituradas y mezcla 5 seg / vel 8. Después 10 seg / vel 4.',
      },
      {
        appliance: 'tm31',
        step_order: 3,
        title: 'Enfriar y congelar',
        description: 'Enfría en nevera mínimo 2 horas. Rellena la tarrina y congela 24h.',
      },
      {
        appliance: 'ninja',
        step_order: 1,
        title: 'Procesar',
        description: 'Templa 2 min fuera del congelador. Programa Ice Cream.',
      },
      {
        appliance: 'ninja',
        step_order: 2,
        title: 'Re-Spin',
        description: 'Haz un hueco en el centro, añade 1-2 cdas de leche fría y ejecuta Re-Spin.',
      },
      {
        appliance: 'ninja',
        step_order: 3,
        title: 'Mix-In',
        description: 'Añade las galletas Oreo troceadas bien frías y ejecuta el programa Mix-In.',
      },
    ],
  },
  {
    id: id(),
    title: 'Helado de Dulce de Leche al estilo Häagen-Dazs',
    slug: 'helado-dulce-de-leche-haagen-dazs',
    section: 'Häagen-Dazs',
    appliance: 'ninja-creami',
    program: 'Ice Cream',
    difficulty: 'Media-Alta',
    calories_per_serving: 411,
    rating: 9.0,
    source: 'Recetario Helados Ninja · Receta 1.3',
    notes: 'Base de vainilla con remolino de dulce de leche. El eritritol no carameliza igual — Opción A casera (más ligera) u Opción B con La Lechera (sabor más intenso).',
    has_mixin: 0,
    is_public: 1,
    tags: ['dulce-de-leche', 'clásico', 'caramelo'],
    groups: [
      {
        label: 'Base de vainilla',
        items: [
          '220 ml nata para montar (35% MG)',
          '150 ml leche evaporada desnatada',
          '2 yemas de huevo',
          '60g eritritol',
          '5g extracto de vainilla (1 cdta)',
        ],
      },
      {
        label: 'Remolino de dulce de leche (Opción A — casero)',
        items: [
          '400 ml leche entera',
          '120g eritritol',
          '1 pizca de bicarbonato',
        ],
      },
      {
        label: 'Remolino (Opción B — comprado, recomendada)',
        items: [
          '3-4 cdas de dulce de leche La Lechera o similar',
        ],
      },
    ],
    steps: [
      {
        appliance: 'tm31',
        step_order: 1,
        title: 'Base de vainilla',
        description: 'Nata, leche evaporada, yemas, eritritol y vainilla en el vaso. Programa 8 min / 80°C / vel 3. Enfría en nevera.',
      },
      {
        appliance: 'tm31',
        step_order: 2,
        title: 'Dulce de leche casero (Opción A)',
        description: 'Mientras se enfría la base: 400 ml leche, 120g eritritol y una pizca de bicarbonato en el vaso con el cestillo puesto. 40 min / 90°C / vel 2. Deja enfriar también.',
      },
      {
        appliance: 'tm31',
        step_order: 3,
        title: 'Montaje en tarrina',
        description: 'Vierte la mitad de la base, añade 3-4 cdas de dulce de leche en remolino sin mezclar del todo, añade el resto de la base. Congela 24h.',
      },
      {
        appliance: 'ninja',
        step_order: 1,
        title: 'Procesar y Re-Spin',
        description: 'Templa 2 min. Programa Ice Cream. Re-Spin con 1-2 cdas de nata fría.',
      },
    ],
  },
  {
    id: id(),
    title: 'Sorbete de Mandarina',
    slug: 'sorbete-mandarina',
    section: 'Sorbetes',
    appliance: 'ninja-creami',
    program: 'Sorbet',
    difficulty: 'Fácil',
    calories_per_serving: 120,
    rating: 8.5,
    source: 'Recetario Helados Ninja · Receta 31',
    notes: 'Fresquísimo y muy fácil. Perfecto para depurar entre recetas. Sin lácteos, sin huevo.',
    has_mixin: 0,
    is_public: 1,
    tags: ['sorbete', 'sin-lácteos', 'vegano', 'sin-gluten', 'fruta'],
    groups: [
      {
        label: null,
        items: [
          '500 ml zumo de mandarina natural (unas 8-10 mandarinas)',
          '60g eritritol (ajustar según dulzor de la fruta)',
          '1 cdta zumo de limón',
          '0.5g xantana (opcional, mejora la textura)',
        ],
      },
    ],
    steps: [
      {
        appliance: 'tm31',
        step_order: 1,
        title: 'Preparar la base',
        description: 'Exprime las mandarinas. Mezcla el zumo con el eritritol y el zumo de limón. Si usas xantana, tritura 15 seg / vel 8 para integrarla. Comprueba el dulzor y ajusta.',
      },
      {
        appliance: 'tm31',
        step_order: 2,
        title: 'Congelar',
        description: 'Vierte en la tarrina hasta la línea MAX. Congela 24h en posición plana.',
      },
      {
        appliance: 'ninja',
        step_order: 1,
        title: 'Procesar',
        description: 'Templa 3-4 min (base de fruta necesita algo más). Programa Sorbet.',
      },
      {
        appliance: 'ninja',
        step_order: 2,
        title: 'Re-Spin si es necesario',
        description: 'Si queda granulado, haz un hueco, añade 1-2 cdas de agua fría o zumo y ejecuta Re-Spin.',
      },
    ],
  },
]

async function seed() {
  console.log('🌱 Iniciando seed...')

  // Insertar tags únicos
  const allTags = [...new Set(recipes.flatMap((r) => r.tags))]
  for (const tag of allTags) {
    await db.execute({
      sql: 'INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)',
      args: [id(), tag],
    })
  }
  console.log(`✅ Tags: ${allTags.join(', ')}`)

  for (const recipe of recipes) {
    // Insertar receta
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

    // Tags
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

    console.log(`✅ ${recipe.title}`)
  }

  console.log('\n🎉 Seed completado.')
}

seed().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
