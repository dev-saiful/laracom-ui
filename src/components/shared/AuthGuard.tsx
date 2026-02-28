import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/store/auth'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ShieldOff } from 'lucide-react'

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <ShieldOff className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="text-3xl font-black">403</h1>
          <p className="text-muted-foreground">Sorry, you are not authorized to access this page.</p>
          <Button onClick={() => navigate({ to: '/' })}>Back Home</Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
