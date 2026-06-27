import { getIronSession, IronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { getSessionConfig } from './session-config'
import { db } from './db'
import { verifyPassword } from './password'

export type SessionUser = {
  id: string
  email: string
  nick: string
  isAdmin: boolean
  passwordVersion: number
}

export type AppSession = {
  user?: SessionUser
}

export async function getSession(): Promise<IronSession<AppSession>> {
  const cookieStore = await cookies()
  return getIronSession<AppSession>(cookieStore, getSessionConfig())
}

type DbUser = {
  id: string
  email: string
  nick: string
  password_hash: string
  is_admin: number
  password_version: number
}

async function getUserByEmail(email: string): Promise<DbUser | null> {
  const { rows } = await db.execute({
    sql: 'SELECT id, email, nick, password_hash, is_admin, password_version FROM users WHERE email = ?',
    args: [email],
  })
  if (rows.length === 0) return null
  return rows[0] as unknown as DbUser
}

export async function getUserById(id: string): Promise<Omit<DbUser, 'password_hash'> | null> {
  const { rows } = await db.execute({
    sql: 'SELECT id, email, nick, is_admin, password_version FROM users WHERE id = ?',
    args: [id],
  })
  if (rows.length === 0) return null
  return rows[0] as unknown as Omit<DbUser, 'password_hash'>
}

export async function validateCredentials(email: string, password: string): Promise<SessionUser | null> {
  const user = await getUserByEmail(email)
  if (!user) {
    // Ejecutar bcrypt igualmente para evitar timing attacks que enumeren emails válidos
    await verifyPassword(password, '$2a$12$invalidhashpaddingtoconstanttime000000000000000000000')
    return null
  }

  const ok = await verifyPassword(password, user.password_hash)
  if (!ok) return null

  return {
    id: user.id,
    email: user.email,
    nick: user.nick,
    isAdmin: user.is_admin === 1,
    passwordVersion: user.password_version,
  }
}

export async function checkPasswordVersion(userId: string, storedVersion: number): Promise<boolean> {
  const { rows } = await db.execute({
    sql: 'SELECT password_version FROM users WHERE id = ?',
    args: [userId],
  })
  if (rows.length === 0) return false
  return (rows[0].password_version as number) === storedVersion
}
