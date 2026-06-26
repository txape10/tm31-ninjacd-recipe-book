import { getIronSession, IronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { timingSafeEqual } from 'crypto'
import { getSessionConfig } from './session-config'

export type SessionUser = {
  email: string
  isAdmin: boolean
}

export type AppSession = {
  user?: SessionUser
}

export async function getSession(): Promise<IronSession<AppSession>> {
  const cookieStore = await cookies()
  return getIronSession<AppSession>(cookieStore, getSessionConfig())
}

function safeEqual(a: string, b: string): boolean {
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b))
  } catch {
    // timingSafeEqual throws if buffers have different lengths
    return false
  }
}

export function validateCredentials(email: string, password: string): SessionUser | null {
  const users = [
    {
      email: process.env.USER1_EMAIL ?? '',
      password: process.env.USER1_PASSWORD ?? '',
      isAdmin: process.env.USER1_ADMIN === 'true',
    },
    {
      email: process.env.USER2_EMAIL ?? '',
      password: process.env.USER2_PASSWORD ?? '',
      isAdmin: process.env.USER2_ADMIN === 'true',
    },
  ]

  // Always check all users to prevent timing attacks that enumerate valid emails
  let match: (typeof users)[0] | null = null

  for (const user of users) {
    const emailMatch = safeEqual(user.email, email)
    const passwordMatch = safeEqual(user.password, password)
    if (emailMatch && passwordMatch && user.email !== '') {
      match = user
    }
  }

  if (!match) return null
  return { email: match.email, isAdmin: match.isAdmin }
}
