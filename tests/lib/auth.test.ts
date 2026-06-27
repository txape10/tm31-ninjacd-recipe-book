import { describe, it, expect } from 'vitest'
import { validateCredentials } from '@/lib/auth'

describe('validateCredentials', () => {
  it('returns admin user for valid admin credentials', () => {
    const result = validateCredentials('admin@test.com', 'admin-pass')
    expect(result).toEqual({ email: 'admin@test.com', isAdmin: true })
  })

  it('returns non-admin user for valid user credentials', () => {
    const result = validateCredentials('user@test.com', 'user-pass')
    expect(result).toEqual({ email: 'user@test.com', isAdmin: false })
  })

  it('returns null for wrong password', () => {
    expect(validateCredentials('admin@test.com', 'wrong-pass')).toBeNull()
  })

  it('returns null for wrong email', () => {
    expect(validateCredentials('nobody@test.com', 'admin-pass')).toBeNull()
  })

  it('returns null for empty credentials', () => {
    expect(validateCredentials('', '')).toBeNull()
  })

  it('returns null when only email matches but password is wrong', () => {
    expect(validateCredentials('admin@test.com', 'user-pass')).toBeNull()
  })

  it('is case-sensitive for email', () => {
    expect(validateCredentials('Admin@test.com', 'admin-pass')).toBeNull()
  })
})
