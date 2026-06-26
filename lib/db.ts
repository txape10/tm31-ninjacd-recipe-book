import { createClient } from '@libsql/client'

if (!process.env.TURSO_DATABASE_URL) {
  throw new Error('TURSO_DATABASE_URL is not set')
}
if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error('TURSO_AUTH_TOKEN is not set')
}

declare global {
  // eslint-disable-next-line no-var
  var __libsqlClient: ReturnType<typeof createClient> | undefined
}

export const db =
  globalThis.__libsqlClient ??
  createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__libsqlClient = db
}
