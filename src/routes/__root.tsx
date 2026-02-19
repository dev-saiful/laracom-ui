import { createRootRouteWithContext, Outlet, useRouter } from '@tanstack/react-router'
import { Button, Result } from 'antd'
import type { QueryClient } from '@tanstack/react-query'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { GlobalErrorListener } from '@/components/shared/GlobalErrorListener'

interface RouterContext {
  queryClient: QueryClient
}

function RootErrorComponent({ error }: { error: Error }) {
  const router = useRouter()
  const is404 = error.message?.includes('404') || error.message?.toLowerCase().includes('not found')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Result
        status={is404 ? '404' : '500'}
        title={is404 ? 'Page Not Found' : 'Something Went Wrong'}
        subTitle={
          is404
            ? "The page you're looking for doesn't exist."
            : import.meta.env.DEV
              ? error.message
              : 'An unexpected error occurred. Please try again.'
        }
        extra={[
          <Button type="primary" key="back" onClick={() => router.history.back()}>
            Go Back
          </Button>,
          <Button key="home" onClick={() => router.navigate({ to: '/' })}>
            Home
          </Button>,
        ]}
      />
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
