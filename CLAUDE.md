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

## Autenticación

**Sin login → sin acceso.** La vista de recetas no es pública.

Dos usuarios definidos en variables de entorno:

```
USER1_EMAIL=...        USER1_PASSWORD=...   USER1_ADMIN=true
USER2_EMAIL=...        USER2_PASSWORD=...   USER2_ADMIN=false
```

- **Admin** (`USER1_ADMIN=true`): puede ver, crear y editar todas las recetas
- **Usuario normal**: puede ver recetas públicas + las suyas, crear recetas propias y editarlas
- Cada receta tiene `created_by` (email) y `is_public` (0/1)
- Sesión gestionada con `iron-session`, config en `lib/session-config.ts`

## Modelo de datos

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
  rating: number | null    // 1–10 con pasos de 0.5
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

## Estructura de carpetas

```
/app
  layout.tsx
  globals.css
  /login / page.tsx
  /recetas
    layout.tsx              — sidebar + main
    page.tsx                — listado por secciones
    /[slug] / page.tsx      — detalle de receta
  /api
    /auth/login/route.ts
    /auth/logout/route.ts
    /auth/session/route.ts
    /recipes/[id]/route.ts          — PUT, DELETE
    /recipes/[id]/rating/route.ts   — POST valoración
/components
  /ui                       — shadcn/ui generados
  /recipe
    RecipeCard.tsx
    StarRating.tsx
    IngredientsList.tsx
    StepsList.tsx
  /layout
    Sidebar.tsx
  ThemeProvider.tsx
  ThemeToggle.tsx
/lib
  db.ts                     — cliente Turso singleton
  auth.ts                   — iron-session helpers + validateCredentials
  session-config.ts         — getSessionConfig() compartida
  recipes.ts                — queries (getRecipes, getRecipeBySlug, getRecipeDetail, canEditRecipe)
  validation.ts             — zod schemas
/scripts
  seed.mjs                  — seed con 4 recetas de prueba
/migrations
  001_init.sql
  002_add_ownership.sql
/docs                       — NO sube a git (.gitignore)
  recetario_helados_ninja.md
  recetario_ninja_oficial.md
```

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
| **3** | Detalle de receta: ingredientes, pasos por appliance, valoración con estrellas | 🔄 En curso |
| **4** | Formularios crear/editar recetas | ⏳ Pendiente |
| **5** | Diseño visual avanzado + shadcn personalizado | ⏳ Pendiente |
| **6** | PWA + offline | ⏳ Pendiente |
| **7** | Tests + QA | ⏳ Pendiente |

## Backlog / ideas apuntadas

- **Fotos de receta** — subida y visualización por receta (decidir storage: Vercel Blob, Cloudflare R2…)
- **Valoración interactiva** — campo `rating` ya existe en BD; falta la UI (en Fase 3)
