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

  const result = await createInviteCode(session.user.id)
  return NextResponse.json(result, { status: 201 })
}
