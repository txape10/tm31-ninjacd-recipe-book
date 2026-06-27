import { randomBytes } from 'crypto'
import { db } from './db'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin 0,O,1,I para evitar confusión visual
const CODE_LENGTH = 8
const TTL_HOURS = 24

function generateCode(): string {
  const bytes = randomBytes(CODE_LENGTH)
  return Array.from(bytes)
    .map((b) => ALPHABET[b % ALPHABET.length])
    .join('')
}

export async function createInviteCode(createdBy: string): Promise<{ code: string; expiresAt: string }> {
  const expiresAt = new Date(Date.now() + TTL_HOURS * 60 * 60 * 1000).toISOString()

  let code = generateCode()
  for (let attempt = 0; attempt < 4; attempt++) {
    const { rows } = await db.execute({ sql: 'SELECT 1 FROM invite_codes WHERE code = ?', args: [code] })
    if (rows.length === 0) break
    code = generateCode()
  }

  try {
    await db.execute({
      sql: 'INSERT INTO invite_codes (code, created_by, expires_at) VALUES (?, ?, ?)',
      args: [code, createdBy, expiresAt],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('UNIQUE') || msg.includes('unique')) {
      throw new Error('No se pudo generar un código único. Inténtalo de nuevo.')
    }
    throw err
  }

  return { code, expiresAt }
}

export type CodeValidationResult =
  | { valid: true }
  | { valid: false; reason: 'not_found' | 'expired' | 'already_used' }

export async function validateInviteCode(code: string): Promise<CodeValidationResult> {
  const { rows } = await db.execute({
    sql: 'SELECT expires_at, used_by FROM invite_codes WHERE code = ?',
    args: [code.toUpperCase()],
  })
  if (rows.length === 0) return { valid: false, reason: 'not_found' }

  const row = rows[0]
  if (row.used_by) return { valid: false, reason: 'already_used' }
  if (new Date(row.expires_at as string) < new Date()) return { valid: false, reason: 'expired' }

  return { valid: true }
}

export async function markCodeUsed(code: string, userId: string): Promise<void> {
  await db.execute({
    sql: 'UPDATE invite_codes SET used_by = ?, used_at = ? WHERE code = ?',
    args: [userId, new Date().toISOString(), code.toUpperCase()],
  })
}

export type InviteCodeRow = {
  code: string
  createdByNick: string
  expiresAt: string
  usedByNick: string | null
  usedAt: string | null
  status: 'pending' | 'used' | 'expired'
}

export async function listInviteCodes(): Promise<InviteCodeRow[]> {
  const { rows } = await db.execute(`
    SELECT ic.code, ic.expires_at, ic.used_at,
           uc.nick AS created_by_nick,
           uu.nick AS used_by_nick
      FROM invite_codes ic
      JOIN users uc ON uc.id = ic.created_by
      LEFT JOIN users uu ON uu.id = ic.used_by
     ORDER BY ic.expires_at DESC
  `)

  const now = new Date()
  return rows.map((r) => {
    const expired = new Date(r.expires_at as string) < now
    const used = r.used_by_nick !== null
    return {
      code: r.code as string,
      createdByNick: r.created_by_nick as string,
      expiresAt: r.expires_at as string,
      usedByNick: r.used_by_nick as string | null,
      usedAt: r.used_at as string | null,
      status: used ? 'used' : expired ? 'expired' : 'pending',
    }
  })
}
