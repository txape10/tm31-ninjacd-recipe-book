import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createInviteCode, listInviteCodes } from '@/lib/invite-codes'

export async function GET() {
  const session = await getSession()
  if (!session.user?.isAdmin) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const codes = await listInviteCodes()
  return NextResponse.json({ codes })
}

export async function POST() {
  const session = await getSession()
  if (!session.user?.isAdmin) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  try {
    const result = await createInviteCode(session.user.id)
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    console.error('[invite-codes] Error al crear código:', err)
    return NextResponse.json({ error: 'No se pudo generar el código. Inténtalo de nuevo.' }, { status: 500 })
  }
}
