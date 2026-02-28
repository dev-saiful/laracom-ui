import { useEffect } from 'react'
import { toast } from 'sonner'

/**
 * Listens for global `api:error` events dispatched by the Axios interceptor
 * and shows a sonner toast notification.
 */
export function GlobalErrorListener() {
  useEffect(() => {
    const handler = (e: Event) => {
      const { message, status } = (e as CustomEvent<{ message: string; status: number }>).detail
      const title =
        status >= 500 ? 'Server Error'
        : status === 429 ? 'Rate Limited'
        : status === 403 ? 'Access Denied'
        : 'Connection Error'
      toast.error(title, { description: message })
    }
    window.addEventListener('api:error', handler)
    return () => window.removeEventListener('api:error', handler)
  }, [])

  return null
}
