import { NextRequest, NextResponse } from 'next/server'
import { getSession, validateCredentials } from '@/lib/auth'
import { loginSchema } from '@/lib/validation'

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 min

const attempts = new Map<string, { count: number; resetAt: number }>()

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = attempts.get(ip)
  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (record.count >= MAX_ATTEMPTS) return false
  record.count++
  return true
}

function resetRateLimit(ip: string) {
  attempts.delete(ip)
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera 15 minutos.' },
      { status: 429 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
  }

  const result = loginSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
  }

  const user = await validateCredentials(result.data.email, result.data.password)
  if (!user) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
  }

  resetRateLimit(ip)

  const session = await getSession()
  session.user = user
  await session.save()

  return NextResponse.json({ ok: true })
}
