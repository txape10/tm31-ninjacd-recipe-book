export type PasswordStrength = {
  score: number  // 0–4
  errors: string[]
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const errors: string[] = []
  if (password.length < 8) errors.push('Mínimo 8 caracteres')
  if (!/[a-zA-Z]/.test(password)) errors.push('Al menos una letra')
  if (!/[0-9]/.test(password)) errors.push('Al menos un número')
  if (!/[^a-zA-Z0-9]/.test(password)) errors.push('Al menos un símbolo (!@#$…)')

  const score = 4 - errors.length
  return { score, errors }
}
