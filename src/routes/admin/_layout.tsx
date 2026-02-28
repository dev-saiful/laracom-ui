import { createFileRoute } from '@tanstack/react-router'
import AdminLayout from '@/components/layout/AdminLayout'
import AuthGuard from '@/components/shared/AuthGuard'

export const Route = createFileRoute('/admin/_layout')({
  component: AdminLayoutWrapper,
})

function AdminLayoutWrapper() {
  return (
    <AuthGuard requireAdmin>
      <AdminLayout />
    </AuthGuard>
  )
}
