import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'
import { registerSchema } from '@/lib/validation'
import { hashPassword, validatePasswordStrength } from '@/lib/password'
import { validateInviteCode, markCodeUsed } from '@/lib/invite-codes'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 })
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos no válidos', issues: parsed.error.issues }, { status: 400 })
  }

  const { code, email, nick, password } = parsed.data

  // Validar robustez de la contraseña
  const { score, errors: pwErrors } = validatePasswordStrength(password)
  if (score < 4) {
    return NextResponse.json({ error: pwErrors.join('. ') }, { status: 400 })
  }

  // Validar código de invitación
  const codeResult = await validateInviteCode(code)
  if (!codeResult.valid) {
    const messages: Record<string, string> = {
      not_found: 'Código de invitación no válido',
      expired: 'El código de invitación ha caducado',
      already_used: 'El código de invitación ya ha sido utilizado',
    }
    return NextResponse.json({ error: messages[codeResult.reason] }, { status: 400 })
  }

  // Comprobar unicidad de email y nick
  const { rows: existing } = await db.execute({
    sql: 'SELECT email, nick FROM users WHERE email = ? OR nick = ?',
    args: [email, nick],
  })
  if (existing.length > 0) {
    const taken = existing[0]
    if ((taken.email as string).toLowerCase() === email.toLowerCase()) {
      return NextResponse.json({ error: 'Ese email ya está registrado' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Ese nick ya está en uso' }, { status: 409 })
  }

  const id = randomUUID()
  const passwordHash = await hashPassword(password)
  const now = new Date().toISOString()

  await db.execute({
    sql: 'INSERT INTO users (id, email, nick, password_hash, is_admin, password_version, created_at) VALUES (?, ?, ?, ?, 0, 1, ?)',
    args: [id, email, nick, passwordHash, now],
  })

  await markCodeUsed(code, id)

  return NextResponse.json({ ok: true }, { status: 201 })
}
