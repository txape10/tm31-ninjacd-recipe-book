#!/usr/bin/env node

import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local
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

async function reset() {
  console.log('🗑️  Resetting database...\n')

  try {
    // Delete in reverse order of FK dependencies
    const tables = [
      'recipe_tags',
      'recipe_steps',
      'ingredients',
      'ingredient_groups',
      'recipes',
      'tags',
    ]

    for (const table of tables) {
      const result = await db.execute(`DELETE FROM ${table}`)
      const count = result.rowsAffected || 0
      console.log(`  ✓ ${table.padEnd(20)} — ${count} rows deleted`)
    }

    console.log('\n✅ Database reset complete!')
  } catch (error) {
    console.error('❌ Error resetting database:', error.message)
    process.exit(1)
  }
}

reset()
