'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PasswordStrengthIndicator from './PasswordStrengthIndicator'

type Step = 'code' | 'details'

export default function RegisterForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('code')
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [nick, setNick] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length !== 8) {
      setError('El código debe tener 8 caracteres')
      return
    }
    setCode(trimmed)
    setError(null)
    setStep('details')
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setBusy(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, email, nick, password, confirmPassword }),
      })
      const data = await res.json() as Record<string, unknown>
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Error al registrarse')
        return
      }
      router.push('/login?registered=1')
    } catch {
      setError('Error de red. Inténtalo de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'

  if (step === 'code') {
    return (
      <form onSubmit={handleCodeSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Código de invitación
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="XXXXXXXX"
            maxLength={8}
            autoComplete="off"
            className={`${inputClass} tracking-widest text-center text-lg font-mono uppercase`}
            required
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Necesitas un código de invitación para registrarte.
          </p>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Continuar
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
        <span className="text-xs text-muted-foreground">Código:</span>
        <span className="font-mono font-semibold text-sm tracking-widest">{code}</span>
        <button
          type="button"
          onClick={() => { setStep('code'); setError(null) }}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cambiar
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Nick</label>
        <input
          type="text"
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          placeholder="mi_nick"
          pattern="[a-zA-Z0-9_]+"
          minLength={3}
          maxLength={20}
          autoComplete="username"
          className={inputClass}
          required
        />
        <p className="mt-1 text-xs text-muted-foreground">3–20 caracteres. Solo letras, números y guion bajo. No se puede cambiar.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className={inputClass}
          required
        />
        <div className="mt-2">
          <PasswordStrengthIndicator password={password} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Repetir contraseña</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          className={inputClass}
          required
        />
        {confirmPassword && password !== confirmPassword && (
          <p className="mt-1 text-xs text-destructive">Las contraseñas no coinciden</p>
        )}
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {busy ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>
    </form>
  )
}
