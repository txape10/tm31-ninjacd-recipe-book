'use client'

import { useEffect, useState, useCallback } from 'react'
import type { InviteCodeRow } from '@/lib/invite-codes'

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  used:    'bg-muted text-muted-foreground border-border',
  expired: 'bg-destructive/15 text-destructive border-destructive/30',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  used:    'Usado',
  expired: 'Expirado',
}

export default function InviteCodeList({ refresh }: { refresh?: number }) {
  const [codes, setCodes] = useState<InviteCodeRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCodes = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/invite-codes')
      if (res.ok) {
        const data = await res.json() as { codes: InviteCodeRow[] }
        setCodes(data.codes)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCodes() }, [fetchCodes, refresh])

  if (loading) return <p className="text-sm text-muted-foreground">Cargando…</p>
  if (codes.length === 0) return <p className="text-sm text-muted-foreground">Sin códigos generados.</p>

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/30">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Código</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Generado por</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expira</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usado por</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {codes.map((c) => (
            <tr key={c.code} className="bg-card hover:bg-secondary/20 transition-colors">
              <td className="px-4 py-3 font-mono font-semibold tracking-widest">{c.code}</td>
              <td className="px-4 py-3">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${STATUS_BADGE[c.status]}`}>
                  {STATUS_LABEL[c.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{c.createdByNick}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(c.expiresAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{c.usedByNick ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
