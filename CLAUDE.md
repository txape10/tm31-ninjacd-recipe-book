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
