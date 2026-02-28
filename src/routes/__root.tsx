import { createRootRouteWithContext, Outlet, useRouter } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { GlobalErrorListener } from '@/components/shared/GlobalErrorListener'
import { Button } from '@/components/ui/button'

interface RouterContext {
  queryClient: QueryClient
}

function RootErrorComponent({ error }: { error: Error }) {
  const router = useRouter()
  const is404 = error.message?.includes('404') || error.message?.toLowerCase().includes('not found')

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-4">
        <div className="text-6xl font-black text-primary">{is404 ? '404' : '500'}</div>
        <h1 className="text-2xl font-bold text-foreground">
          {is404 ? 'Page Not Found' : 'Something Went Wrong'}
        </h1>
        <p className="text-muted-foreground max-w-md">
          {is404
            ? "The page you're looking for doesn't exist."
            : import.meta.env.DEV
              ? error.message
              : 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => router.history.back()}>Go Back</Button>
          <Button onClick={() => router.navigate({ to: '/' })}>Home</Button>
        </div>
      </div>
    </div>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({
  errorComponent: RootErrorComponent,
  component: () => (
    <ErrorBoundary>
      <GlobalErrorListener />
      <Outlet />
    </ErrorBoundary>
  ),
})
