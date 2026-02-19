import { Result, Button } from 'antd'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/store/auth'
import { useEffect } from 'react'

interface AuthGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const navigate = useNavigate()
  const { isAuthenticated, isAdmin } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/auth/login' })
    }
  }, [isAuthenticated, navigate])

  if (!isAuthenticated) return null

  if (requireAdmin && !isAdmin) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="Sorry, you are not authorized to access this page."
        extra={<Button type="primary" onClick={() => navigate({ to: '/' })}>Back Home</Button>}
      />
    )
  }

  return <>{children}</>
}
