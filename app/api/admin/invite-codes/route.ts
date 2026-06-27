import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createInviteCode, listInviteCodes } from '@/lib/invite-codes'
import { sendInviteCode } from '@/lib/email'

export async function GET() {
  const session = await getSession()
  if (!session.user?.isAdmin) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const codes = await listInviteCodes()
  return NextResponse.json({ codes })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session.user?.isAdmin) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  let email: string | null = null
  try {
    const body = await request.json() as Record<string, unknown>
    if (typeof body.email === 'string' && body.email.trim()) {
      email = body.email.trim()
    }
  } catch {
    // body vacío o no JSON — ok, el email es opcional
  }

  const result = await createInviteCode(session.user.id)

  let emailSent = false
  if (email) {
    try {
      await sendInviteCode(email, result.code, result.expiresAt)
      emailSent = true
    } catch (err) {
      console.error('[invite-codes] Error enviando email:', err)
      // No fallamos la creación del código si falla el envío
    }
  }

  return NextResponse.json({ ...result, emailSent }, { status: 201 })
}
