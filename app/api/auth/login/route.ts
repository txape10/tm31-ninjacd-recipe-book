import { NextRequest, NextResponse } from 'next/server'
import { getSession, validateCredentials } from '@/lib/auth'
import { loginSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
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

  const user = validateCredentials(result.data.email, result.data.password)
  if (!user) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
  }

  const session = await getSession()
  session.user = user
  await session.save()

  return NextResponse.json({ ok: true })
}
