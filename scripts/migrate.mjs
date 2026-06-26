// @ts-check
import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

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

const file = process.argv[2]
if (!file) {
  console.error('Uso: node scripts/migrate.mjs migrations/003_ratings_and_favorites.sql')
  process.exit(1)
}

const sql = readFileSync(join(__dirname, '..', file), 'utf-8')
const statements = sql.split(';').map(s => s.trim()).filter(Boolean)

for (const stmt of statements) {
  await db.execute(stmt)
  console.log('OK:', stmt.slice(0, 60).replace(/\n/g, ' '))
}

console.log('Migración completada.')
