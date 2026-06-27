@AGENTS.md

# Recetario Ninja CREAMi Deluxe — CLAUDE.md

## Descripción del proyecto

App web personal de recetas de cocina. Primera sección: Ninja CREAMi Deluxe.
Diseñada para crecer hacia otras secciones (Thermomix, sous vide, etc.) en el futuro.

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16.2.9 (App Router) + TypeScript |
| UI | shadcn/ui + Tailwind CSS v4 |
| Base de datos | Turso (SQLite distribuido) — `@libsql/client` |
| Auth | Variables de entorno — 2 usuarios fijos (sin DB de usuarios), `iron-session` v8 |
| Hosting | Vercel (free tier, deploy automático desde GitHub) |
| PWA | `@ducanh2912/next-pwa` — instalable en iPhone/iPad/Windows |

## Particularidades de Next.js 16 (rompen con versiones anteriores)

- `middleware.ts` → `proxy.ts`, export `middleware` → `proxy`
- `params` y `searchParams` son Promises — hay que `await props.params`
- Tipos globales: `PageProps<'/ruta'>`, `LayoutProps<'/ruta'>`, `RouteContext<'/ruta'>` (NO `RouteProps`)
- `RouteContext<T>` solo funciona para rutas en `AppRouteHandlerRoutes`; para rutas anidadas usar `props: { params: Promise<{ id: string }> }` directamente

## Autenticación

**Sin login → sin acceso.** La vista de recetas no es pública.

Dos usuarios definidos en variables de entorno:

```
USER1_EMAIL=...        USER1_PASSWORD=...   USER1_ADMIN=true
USER2_EMAIL=...        USER2_PASSWORD=...   USER2_ADMIN=false
```

- **Admin** (`USER1_ADMIN=true`): puede ver, crear y editar todas las recetas
- **Usuario normal**: puede ver recetas públicas + las suyas, crear y editar las propias
- Cada receta tiene `created_by` (email) y `is_public` (0/1)
- Sesión gestionada con `iron-session`, config en `lib/session-config.ts`

## Modelo de datos actual

```typescript
type Recipe = {
  id: string
  title: string
  slug: string
  section: string          // "Häagen-Dazs" | "Clásicos" | "Especiales" | "Sorbetes" | "Batidos"
  appliance: string        // "ninja-creami"
  program: string          // "Ice Cream" | "Gelato" | "Sorbet" | "Milkshake" | "Frappé"
  difficulty: string       // "Fácil" | "Media" | "Media-Alta" | "Alta"
  calories_per_serving: number | null
  avg_rating: number | null  // media de recipe_ratings (1-5 estrellas)
  rating_count: number       // votos totales
  user_rating: number | null // valoración del usuario actual
  is_favorited: boolean      // si el usuario actual la tiene en favoritos
  source: string | null
  notes: string | null
  has_mixin: boolean
  is_public: boolean
  created_by: string       // email del creador
  created_at: string
  updated_at: string
  tags: string[]
}

type IngredientGroup = {
  id: string
  label: string | null     // "Base" | "Mix-In" | null
  items: string[]
}

type RecipeStep = {
  id: string
  appliance: 'tm31' | 'ninja'
  step_order: number
  title: string | null
  description: string
}
```

## Migraciones aplicadas

| # | Fichero | Contenido |
|---|---------|-----------|
| 001 | `001_init.sql` | Schema inicial: recipes, ingredient_groups, ingredients, recipe_steps, tags, recipe_tags |
| 002 | `002_add_ownership.sql` | Columnas `created_by`, `is_public` en recipes |
| 003 | `003_ratings_and_favorites.sql` | Tablas `recipe_ratings` (votos 1-5★) y `recipe_favorites` |

## Estructura de carpetas

```
app/
  layout.tsx
  globals.css
  login/page.tsx
  recetas/
    layout.tsx              — sidebar + main
    page.tsx                — listado por secciones
    [slug]/page.tsx         — detalle de receta
  api/
    auth/login/route.ts
    auth/logout/route.ts
    auth/session/route.ts
    recipes/route.ts                — POST crear receta
    recipes/[id]/route.ts           — PUT, DELETE
    recipes/[id]/rating/route.ts    — POST valoración (INSERT OR REPLACE en recipe_ratings)
    recipes/[id]/favorite/route.ts  — POST añadir / DELETE quitar favorito
  recetas/
    nueva/page.tsx          — formulario crear receta (solo autenticados)
    [slug]/editar/page.tsx  — formulario editar receta (solo creador/admin)

components/
  ui/                       — shadcn/ui generados
  recipe/
    RecipeCard.tsx           — card con foto, rating, favorito
    StarRating.tsx           — 5 estrellas, media + votos, guarda via POST /rating
    FavoriteButton.tsx       — toggle favorito con optimistic update
    IngredientsList.tsx      — grupos de ingredientes con etiqueta opcional
    StepsList.tsx            — pasos por appliance (TM31 naranja, Ninja azul)
    RecipeForm.tsx           — formulario crear/editar (modo create|edit)
    IngredientGroupEditor.tsx — editor dinámico de grupos de ingredientes
    RecipeStepsEditor.tsx    — editor dinámico de pasos TM31/Ninja
  layout/
    Sidebar.tsx              — recibe isLoggedIn como prop (sin useEffect flash)
  ThemeProvider.tsx
  ThemeToggle.tsx            — toggle sistema/claro/oscuro con next-themes

lib/
  db.ts                     — cliente Turso singleton
  auth.ts                   — iron-session helpers + validateCredentials
  session-config.ts         — getSessionConfig() compartida
  recipes.ts                — getRecipes, getRecipeBySlug, getRecipeDetail, canEditRecipe
  validation.ts             — zod schemas (recipeSchema, ratingSchema)

scripts/
  seed.mjs                  — seed con 4 recetas reales
  migrate.mjs               — runner genérico de migraciones SQL

migrations/
  001_init.sql
  002_add_ownership.sql
  003_ratings_and_favorites.sql

docs/                       — NO sube a git (.gitignore)
  recetario_helados_ninja.md
  recetario_ninja_oficial.md
```

## Decisiones técnicas relevantes

- **Tema oscuro/claro**: `next-themes` con `attribute="class"`. En Tailwind v4 usar `@custom-variant dark (&:where(.dark, .dark *))` — el patrón `&:is(.dark *)` excluye el propio `<html>` y rompe el tema.
- **Visibilidad de recetas**: `buildVisibilityFilter(user)` en SQL — admin ve todo, usuario normal ve las suyas + las públicas.
- **Valoración**: tabla `recipe_ratings` (recipe_id, user_email, rating REAL, PK compuesto). 1-5★ en pasos 0.5. Validación: `Number.isInteger(v * 2)` (no `v % 0.5 === 0` — bug de precisión flotante).
- **Favoritos**: tabla `recipe_favorites` (recipe_id, user_email, PK compuesto). FavoriteButton hace optimistic update y revierte en error.
- **Sidebar sin flash**: `recetas/layout.tsx` es async, llama `getSession()` server-side y pasa `isLoggedIn` como prop. Sin `useEffect`/fetch en cliente.

## Diseño y UX

- Paleta oscura inspirada en helados — azul navy/cyan
- Responsive: iPhone (375px) → iPad (768px) → desktop (1280px+)
- Modo oscuro/claro/sistema con `next-themes` — toggle manual en sidebar
- Tipografía: Poppins (headings) · Inter (body) · JetBrains Mono (ingredientes)

## Reglas de trabajo en este proyecto

- Seguir el flujo global: planner → confirmación → código → code-reviewer
- Idioma del código: inglés (variables, funciones, componentes, rutas API)
- Idioma de la UI: español
- Comentarios en el código: solo el "por qué", nunca el "qué"
- Antes de añadir cualquier dependencia npm, justificarla
- Variables de entorno en `.env.local` (local) y en Vercel (producción) — nunca en el código

## Fuentes de datos originales

- `docs/recetario_helados_ninja.md` — recetas personales (Häagen-Dazs, Clásicos, Especiales, Sorbetes, Batidos)
- `docs/recetario_ninja_oficial.md` — recetas oficiales Ninja adaptadas con Thermomix

## Repositorio

- **Repo:** https://github.com/txape10/tm31-ninjacd-recipe-book
- **Branch principal:** `master`

## Estado del proyecto

| Fase | Contenido | Estado |
|---|---|---|
| **1** | Next.js 16 + auth + schema Turso + login | ✅ Completada |
| **2** | Listado de recetas + layout sidebar + tema claro/oscuro | ✅ Completada |
| **2b** | Multi-usuario: ownership, visibilidad pública/privada | ✅ Completada |
| **2c** | Seed con 4 recetas reales del recetario | ✅ Completada |
| **3** | Detalle de receta: ingredientes, pasos por appliance, valoración con estrellas | ✅ Completada |
| **3b** | Fix tema claro/oscuro (Tailwind v4 @custom-variant) | ✅ Completada |
| **4** | Sistema de votos + favoritos + formularios crear/editar | ✅ Completada |
| **5** | Diseño visual avanzado + fotos de receta | ✅ Completada |
| **6** | PWA + offline | ✅ Completada |
| **7** | Tests + QA | ⏳ Pendiente |

## Hoja de ruta — detalle por fase

### Fase 4 — Interacción y gestión de recetas

**4a — Sistema de votos real**
- Migración `003_ratings_and_favorites.sql`: tabla `recipe_ratings` (recipe_id, user_email, rating, created_at)
- `getRecipes` y `getRecipeDetail` devuelven `avg_rating`, `rating_count`, `user_rating`
- API `/api/recipes/[id]/rating` pasa a INSERT OR REPLACE en `recipe_ratings`
- `StarRating` muestra 5 estrellas con media + votos ("4.2 — 3 votos")
- `RecipeCard` muestra rating con estrellas y contador

**4b — Favoritos**
- Tabla `recipe_favorites` (recipe_id, user_email) en la misma migración
- API `/api/recipes/[id]/favorite` → POST (añadir) / DELETE (quitar)
- Componente `FavoriteButton` (corazón) en detalle y en card

**4c — Formularios crear/editar receta**
- Página `/recetas/nueva/page.tsx` (solo autenticados)
- Página `/recetas/[slug]/editar/page.tsx` (solo el creador o admin)
- Formulario: título, sección, programa, dificultad, calorías, tags, grupos de ingredientes, pasos TM31/Ninja, notas, visibilidad
- Validación zod en cliente y servidor
- API `POST /api/recipes` para crear (el `PUT /api/recipes/[id]` ya existe)

### Fase 5 — Diseño visual avanzado

- Personalización profunda de shadcn/ui con la paleta del proyecto
- Fotos de receta: subida a Vercel Blob (o Cloudflare R2), campo `cover_image_url` en BD
- Cards con foto y animaciones hover
- Filtro de favoritos en sidebar
- Vista "mis recetas" separada de "todas"
- Mejoras responsive en mobile (menú hamburguesa para sidebar)

### Fase 6 — PWA + offline

- Configurar `@ducanh2912/next-pwa` con service worker
- Cache offline de recetas ya visitadas
- Instalable en iPhone/iPad/Android/Windows
- Splash screen e iconos

### Fase 7 — Tests + QA

- Unit tests de helpers (auth, recipes, validation) con Vitest
- Tests de integración de las rutas API
- Tests E2E del flujo login → listado → detalle con Playwright

## Backlog / ideas para el futuro

- Secciones adicionales: Thermomix TM31, sous vide, horno de vapor...
- Búsqueda full-text por título e ingredientes
- Compartir receta con link público (sin login)
- Exportar receta a PDF
- Importar recetas desde el recetario oficial Ninja (scraper / markdown parser)
