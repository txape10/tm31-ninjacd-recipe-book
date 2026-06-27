'use client'

import { useState } from 'react'
import { redirect } from 'next/navigation'
import { useEffect } from 'react'
import InviteCodeGenerator from '@/components/admin/InviteCodeGenerator'
import InviteCodeList from '@/components/admin/InviteCodeList'

type User = { id: string; email: string; nick: string; isAdmin: boolean; createdAt: string }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [codeRefresh, setCodeRefresh] = useState(0)

  useEffect(() => {
    fetch('/api/admin/users')
      .then(async (res) => {
        if (res.status === 403) {
          window.location.href = '/recetas'
          return
        }
        const data = await res.json() as { users: User[] }
        setUsers(data.users)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-10">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Panel de administración</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestión de usuarios y códigos de invitación</p>
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
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Registro</th>
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
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString('es-ES')}
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
