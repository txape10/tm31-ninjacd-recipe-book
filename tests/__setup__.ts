import { beforeAll } from 'vitest'

beforeAll(() => {
  process.env.TURSO_DATABASE_URL = 'file::memory:'
  process.env.TURSO_AUTH_TOKEN = ''
  process.env.IRON_SESSION_PASSWORD = 'test-password-must-be-at-least-32-chars!!'
  process.env.USER1_EMAIL = 'admin@test.com'
  process.env.USER1_PASSWORD = 'admin-pass'
  process.env.USER1_ADMIN = 'true'
  process.env.USER2_EMAIL = 'user@test.com'
  process.env.USER2_PASSWORD = 'user-pass'
  process.env.USER2_ADMIN = 'false'
})
