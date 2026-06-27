'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import InviteCodeGenerator from '@/components/admin/InviteCodeGenerator'
import InviteCodeList from '@/components/admin/InviteCodeList'

type User = { id: string; email: string; nick: string; isAdmin: boolean; isBlocked: boolean; createdAt: string }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [codeRefresh, setCodeRefresh] = useState(0)
  const [blockingId, setBlockingId] = useState<string | null>(null)
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const fetchUsers = useCallback(async () => {
    const res = await fetch('/api/admin/users')
    if (res.status === 403) {
      window.location.href = '/recetas'
      return
    }
    const data = await res.json() as { users: User[] }
    setUsers(data.users)
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function toggleBlock(user: User) {
    setBlockingId(user.id)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_blocked: !user.isBlocked }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        alert(data.error ?? 'Error al cambiar el estado del usuario')
        return
      }
      await fetchUsers()
    } catch {
      alert('Error de red')
    } finally {
      setBlockingId(null)
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Panel de administración</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestión de usuarios y códigos de invitación</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <a href="/recetas" className="text-sm px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
            ← Recetas
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Usuarios */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">Usuarios registrados</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nick</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rol</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Registro</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="bg-card hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{u.nick}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      {u.isAdmin ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-primary/15 text-primary border border-primary/30">Admin</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground border border-border">Usuario</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.isBlocked ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-destructive/15 text-destructive border border-destructive/30">Bloqueado</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/15 text-green-400 border border-green-500/30">Activo</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-4 py-3">
                      {u.isAdmin ? (
                        <span className="text-muted-foreground/40 text-xs">—</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleBlock(u)}
                          disabled={blockingId === u.id}
                          className={[
                            'text-xs px-2 py-1 rounded border transition-colors disabled:opacity-50',
                            u.isBlocked
                              ? 'border-green-500/50 text-green-400 hover:bg-green-500/10'
                              : 'border-destructive/50 text-destructive hover:bg-destructive/10',
                          ].join(' ')}
                        >
                          {blockingId === u.id ? 'Guardando…' : (u.isBlocked ? 'Desbloquear' : 'Bloquear')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Códigos de invitación */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">Códigos de invitación</h2>
        <InviteCodeGenerator onGenerated={() => setCodeRefresh((n) => n + 1)} />
        <InviteCodeList refresh={codeRefresh} />
      </section>
    </main>
  )
}
