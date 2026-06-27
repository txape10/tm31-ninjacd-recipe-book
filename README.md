# Recetario Ninja CREAMi Deluxe

App web personal de recetas para la **Ninja CREAMi Deluxe**, construida con Next.js 16 y diseñada para crecer hacia otras secciones (Thermomix, sous vide, etc.).

## Características

- Catálogo de recetas organizado por sección y programa (Ice Cream, Gelato, Sorbet, Milkshake, Frappé)
- Sistema de valoración con estrellas (1–5, pasos de 0.5)
- Favoritos con actualización optimista
- Crear, editar y eliminar recetas con fotos
- Filtros por sección, dificultad, búsqueda libre (sin distinción de acentos), mis recetas y favoritos
- Exportar receta al portapapeles
- Modo oscuro / claro / sistema
- PWA instalable (iPhone, iPad, Android, Windows)
- Multi-usuario con roles (admin / usuario normal) y recetas públicas/privadas
- Registro por código de invitación (un solo uso, 24h de validez)
- Panel de administración para gestionar usuarios y códigos de invitación

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16.2.9 (App Router) + TypeScript |
| UI | shadcn/ui + Tailwind CSS v4 |
| Base de datos | Turso (SQLite distribuido) |
| Auth | Tabla `users` en Turso + bcryptjs + `iron-session` v8 |
| Almacenamiento de imágenes | Vercel Blob |
| Hosting | Vercel |
| PWA | `@ducanh2912/next-pwa` |
| Tests unitarios | Vitest |
| Tests E2E | Playwright |

## Requisitos previos

- Node.js ≥ 20
- Una base de datos [Turso](https://turso.tech) (gratuita)
- Una cuenta [Vercel](https://vercel.com) para deploy y Vercel Blob (opcional, para fotos)

## Instalación

```bash
git clone https://github.com/txape10/tm31-ninjacd-recipe-book
cd tm31-ninjacd-recipe-book
npm install
```

Crea el fichero `.env.local`:

```env
TURSO_DATABASE_URL=libsql://tu-base-de-datos.turso.io
TURSO_AUTH_TOKEN=tu-token

# Genera con: openssl rand -hex 32
IRON_SESSION_PASSWORD=una-cadena-aleatoria-de-al-menos-32-caracteres

# Vercel Blob (opcional, para subida de fotos)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

Aplica las migraciones:

```bash
node scripts/migrate.mjs migrations/005_users.sql
node scripts/migrate.mjs migrations/006_invite_codes.sql
node scripts/migrate.mjs migrations/007_migrate_to_user_ids.sql
node scripts/migrate.mjs migrations/008_rebuild_ratings_favorites.sql
node scripts/migrate.mjs migrations/009_recipes_user_id_not_null.sql
```

Crea el primer usuario admin:

```bash
# Añade temporalmente al .env.local:
# SEED_ADMIN_EMAIL=tu@email.com
# SEED_ADMIN_PASSWORD=contraseña-segura
# SEED_ADMIN_NICK=tu_nick
node scripts/seed-admin.mjs
# Puedes eliminar esas variables del .env.local tras ejecutarlo
```

Carga las recetas de ejemplo (opcional):

```bash
node scripts/seed-all.mjs
```

Arranca el servidor de desarrollo:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) e inicia sesión con tu usuario admin.

## Flujo de registro de nuevos usuarios

1. El admin accede a `/admin/users` y genera un código de invitación.
2. Comparte el código con el nuevo usuario (8 caracteres, válido 24 horas, un solo uso).
3. El nuevo usuario abre `/register`, introduce el código, elige email, nick y contraseña.
4. Una vez registrado, puede iniciar sesión en `/login`.

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con hot-reload |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Aplica una migración SQL (`node scripts/migrate.mjs migrations/00X_...sql`) |
| `npm run db:seed-admin` | Crea el primer usuario admin desde variables de entorno |
| `npm test` | Tests unitarios (Vitest) |
| `npm run test:e2e` | Tests E2E (Playwright, requiere servidor corriendo) |

## Deploy en Vercel

1. Conecta el repositorio en [vercel.com](https://vercel.com).
2. Añade las variables de entorno del `.env.local` en la configuración del proyecto.
3. Cada push a `master` despliega automáticamente.

## Estructura de carpetas

```
app/            — rutas y API (Next.js App Router)
  admin/        — panel de administración
  api/          — rutas API REST
  login/        — página de login
  register/     — registro con código de invitación
  perfil/       — cambio de contraseña
  recetas/      — catálogo de recetas
components/     — componentes React reutilizables
  auth/         — formularios de registro y cambio de contraseña
  admin/        — componentes del panel admin
  recipe/       — cards, formularios y editores de recetas
  layout/       — sidebar y navegación móvil
lib/            — lógica de negocio, DB, auth, validación
migrations/     — migraciones SQL numeradas (001–009)
scripts/        — seed y utilidades de BD
public/         — assets estáticos e iconos PWA
docs/           — documentación interna (no sube a git)
```

## Licencia

Uso personal. Sin licencia de distribución.

---

# Ninja CREAMi Deluxe Recipe Book

Personal recipe web app for the **Ninja CREAMi Deluxe**, built with Next.js 16. Designed to grow into additional sections (Thermomix, sous vide, etc.).

## Features

- Recipe catalogue organised by section and program (Ice Cream, Gelato, Sorbet, Milkshake, Frappé)
- Star rating system (1–5, half-star steps)
- Favourites with optimistic updates
- Create, edit and delete recipes with photos
- Filters by section, difficulty, accent-insensitive free-text search, my recipes and favourites
- Export recipe to clipboard
- Dark / light / system theme
- Installable PWA (iPhone, iPad, Android, Windows)
- Multi-user with roles (admin / regular user) and public/private recipes
- Invite-code registration (single-use, 24-hour expiry)
- Admin panel for managing users and invite codes

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.9 (App Router) + TypeScript |
| UI | shadcn/ui + Tailwind CSS v4 |
| Database | Turso (distributed SQLite) |
| Auth | `users` table in Turso + bcryptjs + `iron-session` v8 |
| Image storage | Vercel Blob |
| Hosting | Vercel |
| PWA | `@ducanh2912/next-pwa` |
| Unit tests | Vitest |
| E2E tests | Playwright |

## Quick start

```bash
git clone https://github.com/txape10/tm31-ninjacd-recipe-book
cd tm31-ninjacd-recipe-book
npm install
# configure .env.local (see Spanish section above)
# run migrations and seed-admin script
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your admin account.
