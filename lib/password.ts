import { hash, compare } from 'bcryptjs'

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, 12)
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return compare(plain, hashed)
}

// Esta función no depende de bcryptjs — se puede importar también en componentes cliente
export { validatePasswordStrength } from './password-strength'
export type { PasswordStrength } from './password-strength'
