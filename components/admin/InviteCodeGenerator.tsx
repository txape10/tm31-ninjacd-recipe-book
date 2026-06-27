'use client'

import { useState } from 'react'

type GeneratedCode = { code: string; expiresAt: string; emailSent?: boolean }

export default function InviteCodeGenerator({ onGenerated }: { onGenerated?: (code: GeneratedCode) => void }) {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<GeneratedCode | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function generate() {
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/admin/invite-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(email.trim() ? { email: email.trim() } : {}),
      })
      const data = await res.json() as Record<string, unknown>
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Error')
        return
      }
      const generated: GeneratedCode = {
        code: data.code as string,
        expiresAt: data.expiresAt as string,
        emailSent: data.emailSent as boolean | undefined,
      }
      setResult(generated)
      setEmail('')
      onGenerated?.(generated)
    } catch {
      setError('Error de red')
    } finally {
      setBusy(false)
    }
  }

  async function copyCode() {
    if (!result) return
    await navigator.clipboard.writeText(result.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const expiresLabel = result
    ? new Date(result.expiresAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
    : null

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email del invitado (opcional)"
          className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          onKeyDown={(e) => e.key === 'Enter' && !busy && generate()}
        />
        <button
          type="button"
          onClick={generate}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {busy ? 'Generando…' : '+ Generar código'}
        </button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/40">
            <span className="font-mono font-bold text-lg tracking-widest text-foreground">{result.code}</span>
            <button
              type="button"
              onClick={copyCode}
              className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
            <span className="ml-auto text-xs text-muted-foreground">Expira: {expiresLabel}</span>
          </div>
          {result.emailSent && (
            <p className="text-xs text-green-500">✓ Código enviado por email</p>
          )}
          {result.emailSent === false && email && (
            <p className="text-xs text-yellow-500">⚠ No se pudo enviar el email — comparte el código manualmente</p>
          )}
        </div>
      )}
    </div>
  )
}
