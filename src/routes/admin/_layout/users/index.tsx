import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import type { User } from '@/types'
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/admin/_layout/users/')({
  component: AdminUsersPage,
})

function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [mutatingId, setMutatingId] = useState<string | null>(null)

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin', 'users', page],
    queryFn: () => adminApi.users.list({ page }).then((r) => r.data),
  })

  const toggleActive = useMutation({
    mutationFn: (id: string) => adminApi.users.toggleActive(id),
    onMutate: (id) => setMutatingId(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('User status updated') },
    onSettled: () => setMutatingId(null),
  })

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => adminApi.users.updateRole(id, role),
    onMutate: ({ id }) => setMutatingId(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('User role updated') },
    onSettled: () => setMutatingId(null),
  })

  const meta = usersData?.meta
  const totalPages = meta?.last_page ?? 1

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Users</h1>
        <p className="text-sm text-slate-400 mt-0.5">Manage customers and admin accounts</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">User</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Role</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600 w-24">Active</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 hidden md:table-cell">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(usersData?.data ?? []).map((user: User) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0 font-bold text-orange-600 text-sm">
                          {user.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{user.name}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700')}>
                          {user.role.toUpperCase()}
                        </span>
                        <button
                          className="text-xs text-indigo-600 hover:underline disabled:opacity-50"
                          disabled={mutatingId === user.id && updateRole.isPending}
                          onClick={() => updateRole.mutate({ id: user.id, role: user.role === 'admin' ? 'customer' : 'admin' })}
                        >
                          {mutatingId === user.id && updateRole.isPending ? <Loader2 className="h-3 w-3 animate-spin inline" /> : 'Change'}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Switch
                        checked={user.is_active}
                        disabled={mutatingId === user.id && toggleActive.isPending}
                        onCheckedChange={() => toggleActive.mutate(user.id)}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{user.phone || '—'}</td>
                  </tr>
                ))}
                {(usersData?.data ?? []).length === 0 && (
                  <tr><td colSpan={4} className="py-16 text-center text-slate-400">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-slate-100 text-sm text-slate-500">
            <span>Page {page} of {totalPages} &middot; {meta?.total} users</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
