// @ts-check
/**
 * Crea el primer usuario admin en la tabla users.
 * Solo se ejecuta si la tabla está vacía.
 *
 * Variables de entorno requeridas (en .env.local):
 *   SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_NICK
 *
 * Uso: node scripts/seed-admin.mjs
 */
import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { hash } from 'bcryptjs'
import { randomUUID } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))

const envPath = join(__dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const [key, ...rest] = trimmed.split('=')
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
}

const { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_NICK } = process.env
if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD || !SEED_ADMIN_NICK) {
  console.error('Faltan SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD o SEED_ADMIN_NICK en .env.local')
  process.exit(1)
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const { rows } = await db.execute('SELECT COUNT(*) AS cnt FROM users')
const count = Number(rows[0].cnt)

if (count > 0) {
  console.log(`La tabla users ya tiene ${count} registro(s). No se crea ningún admin.`)
  process.exit(0)
}

const passwordHash = await hash(SEED_ADMIN_PASSWORD, 12)
const id = randomUUID()
const now = new Date().toISOString()

await db.execute({
  sql: 'INSERT INTO users (id, email, nick, password_hash, is_admin, password_version, created_at) VALUES (?, ?, ?, ?, 1, 1, ?)',
  args: [id, SEED_ADMIN_EMAIL, SEED_ADMIN_NICK, passwordHash, now],
})

console.log(`Admin creado: ${SEED_ADMIN_NICK} <${SEED_ADMIN_EMAIL}> (id: ${id})`)
