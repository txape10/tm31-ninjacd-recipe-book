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
| Auth | Tabla `users` en Turso + bcryptjs + `iron-session` v8 |
| Hosting | Vercel (free tier, deploy automático desde GitHub) |
| PWA | `@ducanh2912/next-pwa` — instalable en iPhone/iPad/Windows |

## Particularidades de Next.js 16 (rompen con versiones anteriores)

- `middleware.ts` → `proxy.ts`, export `middleware` → `proxy`
- `params` y `searchParams` son Promises — hay que `await props.params`
- Tipos globales: `PageProps<'/ruta'>`, `LayoutProps<'/ruta'>`, `RouteContext<'/ruta'>` (NO `RouteProps`)
- `RouteContext<T>` solo funciona para rutas en `AppRouteHandlerRoutes`; para rutas anidadas usar `props: { params: Promise<{ id: string }> }` directamente
- `useSearchParams()` requiere `<Suspense>` en el componente padre para no bloquear el prerendering

## Autenticación

**Sin login → sin acceso.** La vista de recetas no es pública.

Los usuarios se almacenan en la tabla `users` de Turso. **No hay usuarios en variables de entorno.**

```typescript
type SessionUser = {
  id: string            // UUID del usuario en la BD
  email: string
  nick: string          // inmutable, único
  isAdmin: boolean
  passwordVersion: number  // sube +1 al cambiar contraseña; sesiones con versión antigua → logout
}
```

- **Admin** (`is_admin = 1`): puede ver, crear y editar todas las recetas; accede a `/admin/users`
- **Usuario normal**: puede ver recetas públicas + las suyas, crear y editar las propias
- Contraseñas hasheadas con bcrypt (factor 12) — nunca en texto plano
- Registro mediante **código de invitación** de 8 chars (A-Z0-9 sin 0,O,1,I), un solo uso, 24h de validez
- Al cambiar contraseña: `password_version` sube +1 y la sesión actual se destruye → login obligatorio
- Sesión gestionada con `iron-session` v8, config en `lib/session-config.ts`

### Crear el primer admin

```bash
# Añadir al .env.local:
# SEED_ADMIN_EMAIL=tu@email.com
# SEED_ADMIN_PASSWORD=contraseña-segura
# SEED_ADMIN_NICK=tu_nick
node scripts/seed-admin.mjs
# Después puedes eliminar esas variables
```

## Modelo de datos actual

### Tabla `users`

```sql
id              TEXT PRIMARY KEY        -- UUID v4
email           TEXT NOT NULL UNIQUE    -- inmutable
nick            TEXT NOT NULL UNIQUE    -- inmutable, 3-20 chars, [a-zA-Z0-9_]
password_hash   TEXT NOT NULL           -- bcrypt factor 12
is_admin        INTEGER NOT NULL DEFAULT 0
password_version INTEGER NOT NULL DEFAULT 1
created_at      TEXT NOT NULL
```

### Tabla `invite_codes`

```sql
code        TEXT PRIMARY KEY   -- 8 chars alfanumérico uppercase
created_by  TEXT NOT NULL REFERENCES users(id)
expires_at  TEXT NOT NULL      -- ISO timestamp, 24h desde creación
used_by     TEXT REFERENCES users(id)   -- NULL si no usado
used_at     TEXT                        -- NULL si no usado
```

### Tipos TypeScript principales

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
  cover_image_url: string | null
  avg_rating: number | null  // media de recipe_ratings (1-5 estrellas)
  rating_count: number       // votos totales
  user_rating: number | null // valoración del usuario actual
  is_favorited: boolean      // si el usuario actual la tiene en favoritos
  source: string | null
  notes: string | null
  has_mixin: boolean
  is_public: boolean
  created_by: string       // user_id (UUID) del creador — NO es email
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
| 002 | `002_add_ownership.sql` | Columnas `created_by` (email legacy), `is_public` en recipes |
| 003 | `003_ratings_and_favorites.sql` | Tablas `recipe_ratings` y `recipe_favorites` (con user_email, legacy) |
| 004 | `004_cover_image.sql` | Campo `cover_image_url` en recipes |
| 005 | `005_users.sql` | Tabla `users` |
| 006 | `006_invite_codes.sql` | Tabla `invite_codes` |
| 007 | `007_migrate_to_user_ids.sql` | Añade columna `user_id` a recipes/ratings/favorites y backfill desde email |
| 008 | `008_rebuild_ratings_favorites.sql` | Reconstruye ratings y favorites con PK (recipe_id, user_id) |
| 009 | `009_recipes_user_id_not_null.sql` | Reconstruye recipes con `user_id NOT NULL` |

## Estructura de carpetas

```
app/
  layout.tsx
  globals.css
  login/page.tsx
  register/page.tsx           — registro en 2 pasos: código → email+nick+password
  perfil/page.tsx             — cambio de contraseña (cierra sesión al cambiar)
  admin/
    users/page.tsx            — panel admin: lista usuarios + generador de códigos
  recetas/
    layout.tsx                — sidebar + main (pasa nick al Sidebar)
    page.tsx                  — listado por secciones
    [slug]/page.tsx           — detalle de receta
    nueva/page.tsx            — formulario crear receta (solo autenticados)
    [slug]/editar/page.tsx    — formulario editar receta (solo creador/admin)
    tags/page.tsx             — gestión de tags (solo admin)
  api/
    auth/login/route.ts
    auth/logout/route.ts
    auth/session/route.ts
    auth/register/route.ts    — POST: valida código, crea usuario, marca código usado
    auth/profile/
      password/route.ts       — PUT: cambia contraseña, incrementa password_version
    admin/
      invite-codes/route.ts   — GET: lista códigos | POST: genera código (solo admin)
      users/route.ts          — GET: lista usuarios (solo admin)
    recipes/route.ts          — POST crear receta
    recipes/[id]/route.ts     — PUT, DELETE
    recipes/[id]/rating/route.ts    — POST valoración
    recipes/[id]/favorite/route.ts  — POST añadir / DELETE quitar favorito
    recipes/[id]/image/route.ts     — POST subir / DELETE eliminar foto
    tags/[id]/route.ts        — PATCH renombrar / DELETE eliminar tag

components/
  ui/                         — shadcn/ui generados
  auth/
    RegisterForm.tsx           — formulario 2 pasos (código → datos)
    ChangePasswordForm.tsx     — formulario cambio de contraseña
    PasswordStrengthIndicator.tsx — barra de robustez (importa de lib/password-strength)
  admin/
    InviteCodeGenerator.tsx    — campo email opcional + generar + copiar + confirmación envío
    InviteCodeList.tsx         — tabla de códigos con estado (pending/used/expired)
  recipe/
    RecipeCard.tsx             — card con foto, rating, favorito
    StarRating.tsx             — 5 estrellas, media + votos
    FavoriteButton.tsx         — toggle favorito con optimistic update
    IngredientsList.tsx        — grupos de ingredientes con etiqueta opcional
    StepsList.tsx              — pasos por appliance (TM31 naranja, Ninja azul)
    RecipeForm.tsx             — formulario crear/editar (modo create|edit)
    IngredientGroupEditor.tsx  — editor dinámico de grupos de ingredientes
    RecipeStepsEditor.tsx      — editor dinámico de pasos TM31/Ninja
    TagsManager.tsx            — gestión de tags con dialog nativo de confirmación
  form/
    ImageUploadField.tsx       — upload/delete de foto con preview y spinner
  layout/
    Sidebar.tsx                — recibe isLoggedIn, isAdmin, nick como props (sin flash)
    MobileNav.tsx              — menú hamburguesa para mobile
  ThemeProvider.tsx
  ThemeToggle.tsx              — toggle sistema/claro/oscuro con next-themes

lib/
  db.ts                       — cliente Turso singleton
  auth.ts                     — getSession, validateCredentials (DB+bcrypt), getUserById, checkPasswordVersion
  password.ts                 — hashPassword, verifyPassword (bcryptjs) + re-export de password-strength
  password-strength.ts        — validatePasswordStrength (sin bcrypt, importable en cliente)
  invite-codes.ts             — createInviteCode, validateInviteCode, markCodeUsed, listInviteCodes
  email.ts                    — sendInviteCode con Resend (HTML responsive, enlace directo a /register)
  session-config.ts           — getSessionConfig() compartida
  recipes.ts                  — getRecipes, getRecipeBySlug, getRecipeDetail, getRecipeById, canEditRecipe
                                 buildVisibilityFilter (usa user.id), buildRecipeSelect, helpers insert (db.batch)
  filters.ts                  — applyRecipeFilters(recipes, filters, userId) — búsqueda NFD + filtro "Mis recetas"
  validation.ts               — zod schemas: loginSchema, recipeSchema, ratingSchema,
                                 tagUpdateSchema, registerSchema, changePasswordSchema

scripts/
  migrate.mjs                 — runner genérico de migraciones SQL
  seed-admin.mjs              — crea primer admin con bcrypt desde SEED_ADMIN_* en .env.local
  seed-all.mjs                — seed completo de recetas

migrations/
  001_init.sql … 009_recipes_user_id_not_null.sql

docs/                         — NO sube a git (.gitignore)
  recetario_helados_ninja.md
  recetario_ninja_oficial.md
```

## Decisiones técnicas relevantes

- **Auth en BD**: `validateCredentials` es async (query Turso + `bcrypt.compare`). No hay usuarios en env vars.
- **`created_by` en recipes**: contiene `user_id` (UUID), NO email. Columna legacy `created_by` (email) eliminada en migración 009.
- **`buildVisibilityFilter`**: usa `r.user_id` para filtrar recetas propias. Admin ve todo (1=1).
- **`canEditRecipe`**: compara `recipe.created_by` con `user.id` (ambos UUID).
- **Tema oscuro/claro**: `next-themes` con `attribute="class"`. En Tailwind v4 usar `@custom-variant dark (&:where(.dark, .dark *))`.
- **Valoración**: tabla `recipe_ratings` (recipe_id, user_id, rating REAL, PK compuesto). 1-5★ en pasos 0.5. Validación: `Number.isInteger(v * 2)`.
- **Favoritos**: tabla `recipe_favorites` (recipe_id, user_id, PK compuesto). FavoriteButton hace optimistic update y revierte en error.
- **Sidebar sin flash**: `recetas/layout.tsx` es async, llama `getSession()` server-side y pasa `isLoggedIn`, `isAdmin`, `nick` como props.
- **Búsqueda sin acentos**: `normalize('NFD').replace(/\p{Diacritic}/gu, '')` antes de comparar — "frappe" encuentra "Frappé".
- **Race condition edición concurrente**: PUT `/api/recipes/[id]` incluye `AND updated_at = ?` en el WHERE del UPDATE y verifica `rowsAffected > 0` → 409 atómico si hubo edición concurrente.
- **Inserciones atómicas**: `insertIngredientGroups`, `insertRecipeSteps`, `insertRecipeTags` usan `db.batch(statements, 'write')` — todas las operaciones se ejecutan juntas o ninguna. `insertRecipeTags` usa `INSERT INTO recipe_tags ... SELECT ... FROM tags WHERE name IN (...)` dentro del mismo batch, eliminando cualquier race condition entre INSERT y SELECT.
- **`getRecipeById`**: función en `lib/recipes.ts` que devuelve `{ id, created_by, updated_at }` — usada en PUT/DELETE de receta. No duplicar en rutas API.
- **Email de invitación**: `lib/email.ts` encapsula Resend. `POST /api/admin/invite-codes` acepta `{ email? }` en el body; si se pasa, envía el código por email (fallo de envío no bloquea la creación del código). El código va **solo en el cuerpo del email**, nunca en la URL. El enlace va a `/register` sin parámetros.
- **Filtro "Mis recetas"**: `applyRecipeFilters` recibe `userId` (UUID), compara con `recipe.created_by` (también UUID). Prop `currentUserId` en RecipeCard (antes era `currentUserEmail`, bug que impedía detectar recetas propias).
- **`PasswordStrengthIndicator`** importa de `lib/password-strength.ts` (sin bcryptjs) para ser usable como Client Component.
- **`useSearchParams()` en login/page.tsx**: extraído a `<LoginBanners>` envuelto en `<Suspense>` — necesario en Next.js 16 para prerendering estático.

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

## Variables de entorno necesarias

```env
# Base de datos
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...

# Sesión
IRON_SESSION_PASSWORD=...        # mínimo 32 chars — openssl rand -hex 32

# Vercel Blob (fotos de receta)
BLOB_READ_WRITE_TOKEN=...        # desde Vercel Dashboard > Storage > tu blob store

# Email — Resend (plan gratuito: 3.000/mes, 100/día)
RESEND_API_KEY=re_...            # desde resend.com/api-keys
NEXT_PUBLIC_APP_URL=https://...  # URL pública de la app (para los enlaces en los emails)
```

### Variables temporales solo para el primer setup

```env
# Solo necesarias para ejecutar seed-admin.mjs (borrar después)
SEED_ADMIN_EMAIL=tu@email.com
SEED_ADMIN_PASSWORD=contraseña-segura
SEED_ADMIN_NICK=tu_nick
```

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
| **7** | Tests + QA | ✅ Completada |
| **8** | Auth en BD: tabla users, bcrypt, códigos de invitación, registro, panel admin | ✅ Completada |
| **9** | Correcciones arquitectura: proxy PUBLIC_PATHS, filtro userId, seed UUID, transacciones batch, race condition atómica, email invitación (Resend) | ✅ Completada |
| **10** | Correcciones de calidad: listInviteCodes { sql, args }, tags .trim().min(1), cast seguro normalizeRecipeRow, email código solo en body con tono cálido, insertRecipeTags INSERT-SELECT atómico, getRecipeById centralizado, RouteContext unificado | ✅ Completada |

## Backlog / ideas para el futuro

- Secciones adicionales: Thermomix TM31, sous vide, horno de vapor...
- Búsqueda full-text por título e ingredientes (FTS en Turso, en lugar de filtro JS client-side)
- Compartir receta con link público (sin login)
- Exportar receta a PDF
- Importar recetas desde el recetario oficial Ninja (scraper / markdown parser)
- Recomendaciones basadas en favoritos (JOIN simple en getRecipes)
- Versioning de recetas (tabla recipe_versions para auditoría/rollback)
