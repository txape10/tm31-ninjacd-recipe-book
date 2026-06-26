# Recetario Ninja CREAMi Deluxe — CLAUDE.md

## Descripción del proyecto

App web personal de recetas de cocina. Primera sección: Ninja CREAMi Deluxe.
Diseñada para crecer hacia otras secciones (Thermomix, sous vide, etc.) en el futuro.

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| UI | shadcn/ui + Radix UI + Tailwind CSS |
| Base de datos | Turso (SQLite distribuido) |
| Auth | Variables de entorno — 2 usuarios fijos (sin DB de usuarios) |
| Hosting | Vercel (free tier, deploy automático desde GitHub) |
| PWA | next-pwa — instalable en iPhone/iPad/Windows |

## Skills instaladas (nivel proyecto)

- `nextjs-react-typescript` — Next.js, React, shadcn/ui, Radix, TypeScript
- `pwa-development` — configuración PWA, service workers, manifest
- `turso-db` — integración con Turso (@tursodatabase/database)
- `tailwind-design-system` — design tokens, theming con CSS variables, shadcn
- `designing-beautiful-websites` — criterio visual, tipografía, jerarquía
- `shadcn-component-discovery` — descubrimiento y uso avanzado de componentes shadcn

## Autenticación

**Sin login → sin acceso.** Ni siquiera la vista de recetas es pública.

Dos usuarios definidos en variables de entorno de Vercel:

```
USER1_EMAIL=...        USER1_PASSWORD=...   USER1_ADMIN=true
USER2_EMAIL=...        USER2_PASSWORD=...   USER2_ADMIN=false
```

- **Admin** (USER1_ADMIN=true): puede ver, crear y editar recetas
- **Usuario normal**: solo puede ver y navegar recetas
- Sesión gestionada con cookie firmada (iron-session)
- Sin registro, sin recuperación de contraseña — gestión manual de credenciales en Vercel

## Modelo de datos — Receta

```typescript
type Recipe = {
  id: string
  title: string
  slug: string
  section: string          // "Häagen-Dazs" | "Clásicos" | "Especiales" | "Sorbetes" | "Batidos" | ...
  appliance: string        // "ninja-creami" | "thermomix" | "sous-vide" | ...  (para futuras secciones)
  program: string          // "Ice Cream" | "Gelato" | "Sorbet" | "Milkshake" | "Frappé" | ...
  difficulty: string       // "Fácil" | "Media" | "Media-Alta" | "Alta"
  calories_per_serving: number | null
  rating: number | null    // 1-10
  source: string | null    // "oficial" | "personal" | ...
  tags: string[]           // ["vegano", "sin-gluten", "sin-lacteos", "alcohol"]
  ingredients: IngredientGroup[]
  steps_thermomix: Step[]
  steps_ninja: Step[]
  notes: string | null
  has_mixin: boolean
  created_at: string
  updated_at: string
}

type IngredientGroup = {
  label: string | null     // "Base" | "Mix-In" | null
  items: string[]
}

type Step = {
  order: number
  title: string | null
  description: string
}
```

## Estructura de carpetas prevista

```
/app
  /login              — página de login
  /recetas            — listado con filtros
  /recetas/[slug]     — detalle de receta
  /recetas/nueva      — formulario de creación (solo admin)
  /recetas/[slug]/editar  — formulario de edición (solo admin)
  /api
    /auth/...         — login, logout, sesión
    /recetas/...      — CRUD de recetas
/components
  /ui                 — componentes shadcn generados
  /recipe             — componentes específicos de receta
/lib
  /db.ts              — cliente Turso
  /auth.ts            — helpers de autenticación / iron-session
  /recipes.ts         — queries a la BD
/public
  /icons              — iconos PWA
  manifest.json
```

## Fuentes de datos originales

Los ficheros Markdown con las recetas originales están en `docs/`:
- `docs/recetario_helados_ninja.md` — recetas personales (Häagen-Dazs, Clásicos, Especiales, Sorbetes, Batidos)
- `docs/recetario_ninja_oficial.md` — recetas oficiales Ninja adaptadas con Thermomix

Estos ficheros son la fuente de verdad inicial. Al arrancar el proyecto se migrarán a la BD Turso mediante un script de seed.

## Diseño y UX

- App privada pero con aspecto cuidado — **no genérico**
- Paleta de colores inspirada en helados / tonos fríos y cremosos
- Responsive: iPhone (375px) → iPad (768px) → desktop (1280px+)
- Modo oscuro compatible desde el inicio (Tailwind dark mode + CSS variables)
- Componentes shadcn/ui personalizados — no usar defaults sin ajustar
- Tipografía con personalidad: no usar Inter sin más

## Reglas de trabajo en este proyecto

- Seguir el flujo global: planner → confirmación → código → code-reviewer
- Idioma del código: inglés (nombres de variables, funciones, componentes, rutas API)
- Idioma de la UI: español
- Comentarios en el código: solo el "por qué", nunca el "qué"
- Antes de añadir cualquier dependencia npm, justificarla — no añadir paquetes innecesarios
- Variables de entorno siempre en `.env.local` (local) y en Vercel (producción) — nunca en el código
- El fichero `.env.local` está en `.gitignore` — nunca subir credenciales

## Comandos habituales

```bash
npm run dev        # desarrollo local
npm run build      # build de producción
npm run lint       # ESLint
npx turso db shell recetario   # consola Turso (nombre BD a confirmar)
```

---

## Estado del proyecto — continuación de sesión

> **Instrucciones para Claude al inicio de una nueva sesión:**
> El plan de implementación está aprobado y listo para ejecutar. La siguiente acción es
> **iniciar la Fase 1** — no hace falta volver a planificar. Leer esta sección completa antes de empezar.

### Plan aprobado: 7 fases

| Fase | Contenido | Estado |
|---|---|---|
| **1** | Inicializar Next.js + schema Turso + autenticación + login | ⏳ Pendiente — **SIGUIENTE** |
| **2** | Script seed (.md → Turso) + listado con filtros | ⏳ Pendiente |
| **3** | Detalle de receta (tabs Thermomix / Ninja CREAMi) | ⏳ Pendiente |
| **4** | Formularios crear/editar recetas (solo admin) | ⏳ Pendiente |
| **5** | Diseño visual + shadcn personalizado | ⏳ Pendiente |
| **6** | PWA + offline | ⏳ Pendiente |
| **7** | Tests + QA | ⏳ Pendiente |

### Decisiones técnicas aprobadas

| Decisión | Elección |
|---|---|
| Auth | `iron-session` v8 + credenciales en variables de entorno |
| PWA | `@ducanh2912/next-pwa` |
| Validación formularios | `zod` |
| Tipografía headings | **Poppins** 600/700 (Google Fonts) |
| Tipografía body | **Inter** 400/500 (Google Fonts) |
| Tipografía mono (ingredientes) | **JetBrains Mono** (Google Fonts) |
| Modo oscuro | Por defecto — `darkMode: 'class'` en Tailwind |

### Paleta de colores aprobada

```css
--color-bg-dark:     #1a1a2e   /* fondo principal */
--color-bg-darker:   #0f0f1e   /* fondo más oscuro */
--color-primary:     hsl(210 100% 50%)   /* azul vivo — CTA */
--color-accent-cold: hsl(185 100% 50%)   /* cyan frío — accents */
--color-accent-warm: hsl(30 100% 60%)    /* naranja suave — atención */
--color-cream-50:    hsl(40 100% 95%)    /* crema muy clara */
```

### Schema de BD aprobado (5 tablas)

```
recipes
  ├── recipe_tags       (many-to-many: recipe ↔ tag)
  ├── ingredient_groups (grupos "Base", "Mix-In", etc.)
  │     └── ingredients (items dentro de cada grupo)
  └── recipe_steps      (pasos por appliance: thermomix / ninja-creami)
```

### Variables de entorno necesarias (crear .env.local)

```
TURSO_DATABASE_URL=         # libsql://... desde el dashboard de Turso
TURSO_AUTH_TOKEN=           # token de Turso
IRON_SESSION_PASSWORD=      # openssl rand -hex 32 (mínimo 32 caracteres)
USER1_EMAIL=
USER1_PASSWORD=
USER1_ADMIN=true
USER2_EMAIL=
USER2_PASSWORD=
USER2_ADMIN=false
```

### Repositorio GitHub

- **Repo:** https://github.com/txape10/ninjacd-recipe-book
- **Branch principal:** `master`
- **Hosting:** Vercel (conectar al repo tras el primer push con código)

### Estructura de carpetas completa aprobada

```
/app
  layout.tsx
  globals.css
  /login
    page.tsx
  /recetas
    layout.tsx
    page.tsx
    /[slug]
      page.tsx
      /editar/page.tsx
    /nueva/page.tsx
  /api
    /auth/login/route.ts
    /auth/logout/route.ts
    /auth/session/route.ts
    /recetas/route.ts
    /recetas/[id]/route.ts
/components
  /ui                          — shadcn/ui generados
  /recipe
    recipe-card.tsx
    recipe-detail.tsx
    recipe-form.tsx
    ingredient-group-editor.tsx
    step-editor.tsx
    filter-sidebar.tsx
  /layout
    header.tsx
    sidebar.tsx
/lib
  db.ts                        — cliente Turso singleton
  auth.ts                      — iron-session helpers
  recipes.ts                   — queries (read + write)
  validation.ts                — zod schemas
/scripts
  seed.ts                      — parse .md → INSERT en Turso
/migrations
  001_init.sql                 — schema completo
/public
  /icons
  manifest.json
```
