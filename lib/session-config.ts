import type { SessionOptions } from 'iron-session'

export function getSessionConfig(): SessionOptions {
  const password = process.env.IRON_SESSION_PASSWORD
  if (!password) throw new Error('IRON_SESSION_PASSWORD is not set')
  if (password.length < 32) throw new Error('IRON_SESSION_PASSWORD must be at least 32 characters')

  return {
    password,
    cookieName: 'tm31_session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    },
  }
}
