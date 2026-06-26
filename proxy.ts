import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import type { AppSession } from '@/lib/auth'
import { getSessionConfig } from '@/lib/session-config'

const PUBLIC_PATHS = ['/login', '/api/auth/login']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  const session = await getIronSession<AppSession>(request, response, getSessionConfig())

  if (!session.user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)'],
}
