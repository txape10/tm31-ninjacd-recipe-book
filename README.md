# Recetario Ninja CREAMi Deluxe

App web personal de recetas para la **Ninja CREAMi Deluxe**, construida con Next.js 16 y diseñada para crecer hacia otras secciones (Thermomix, sous vide, etc.).

## Características

- Catálogo de recetas organizado por sección y programa (Ice Cream, Gelato, Sorbet, Milkshake, Frappé)
- Sistema de valoración con estrellas (1–5, pasos de 0.5)
- Favoritos con actualización optimista
- Crear, editar, clonar y eliminar recetas con fotos
- Filtros por sección, dificultad, búsqueda libre, mis recetas y favoritos
- Exportar receta al portapapeles
- Modo oscuro / claro / sistema
- PWA instalable (iPhone, iPad, Android, Windows)
- Multi-usuario con roles (admin / usuario normal) y recetas públicas/privadas

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16.2.9 (App Router) + TypeScript |
| UI | shadcn/ui + Tailwind CSS v4 |
| Base de datos | Turso (SQLite distribuido) |
| Auth | Variables de entorno + `iron-session` v8 |
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

Crea el fichero `.env.local` con las variables necesarias:

```env
TURSO_DATABASE_URL=libsql://tu-base-de-datos.turso.io
TURSO_AUTH_TOKEN=tu-token

USER1_EMAIL=tu@email.com
USER1_PASSWORD=contraseña-segura
USER1_ADMIN=true

USER2_EMAIL=otro@email.com
USER2_PASSWORD=otra-contraseña
USER2_ADMIN=false

SESSION_SECRET=una-cadena-aleatoria-de-al-menos-32-caracteres

BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...   # opcional, para subida de fotos
```

Aplica las migraciones y carga las recetas de ejemplo:

```bash
npm run migrate
npm run seed
```

Arranca el servidor de desarrollo:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) e inicia sesión con las credenciales de `USER1_EMAIL`.

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con hot-reload |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm run migrate` | Aplica migraciones SQL pendientes |
| `npm run seed` | Carga recetas de ejemplo en la BD |
| `npm run seed:all` | Seed completo (recetas + ingredientes + pasos) |
| `npm test` | Tests unitarios (Vitest) |
| `npm run test:e2e` | Tests E2E (Playwright, requiere servidor corriendo) |

## Deploy en Vercel

1. Conecta el repositorio en [vercel.com](https://vercel.com).
2. Añade las variables de entorno del `.env.local` en la configuración del proyecto.
3. Cada push a `master` despliega automáticamente.

## Estructura de carpetas

```
app/            — rutas y API (Next.js App Router)
components/     — componentes React reutilizables
lib/            — lógica de negocio, DB, auth, validación
migrations/     — migraciones SQL numeradas
scripts/        — seed y utilidades de BD
tests/          — tests unitarios y E2E
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
- Create, edit, clone and delete recipes with photos
- Filters by section, difficulty, free-text search, my recipes and favourites
- Export recipe to clipboard
- Dark / light / system theme
- Installable PWA (iPhone, iPad, Android, Windows)
- Multi-user with roles (admin / regular user) and public/private recipes

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.9 (App Router) + TypeScript |
| UI | shadcn/ui + Tailwind CSS v4 |
| Database | Turso (distributed SQLite) |
| Auth | Environment variables + `iron-session` v8 |
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
# copy .env.local (see Spanish section above for required vars)
npm run migrate
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your `USER1_EMAIL` credentials.
