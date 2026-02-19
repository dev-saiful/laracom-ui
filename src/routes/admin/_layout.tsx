import { createFileRoute } from '@tanstack/react-router'
import AdminLayout from '@/components/layout/AdminLayout'
import AuthGuard from '@/components/shared/AuthGuard'
import { App } from 'antd'

export const Route = createFileRoute('/admin/_layout')({
  component: AdminLayoutWrapper,
})

function AdminLayoutWrapper() {
  return (
    <AuthGuard requireAdmin>
      <App>
        <AdminLayout />
      </App>
    </AuthGuard>
  )
}
