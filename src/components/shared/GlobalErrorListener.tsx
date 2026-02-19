import { useEffect } from 'react'
import { App } from 'antd'

/**
 * Listens for global `api:error` events dispatched by the Axios interceptor
 * and shows an Ant Design notification. Mount this once inside <App>.
 */
export function GlobalErrorListener() {
  const { notification } = App.useApp()

  useEffect(() => {
    const handler = (e: Event) => {
      const { message, status } = (e as CustomEvent<{ message: string; status: number }>).detail

      notification.error({
        message: status >= 500 ? 'Server Error' : status === 429 ? 'Rate Limited' : status === 403 ? 'Access Denied' : 'Connection Error',
        description: message,
        placement: 'topRight',
        duration: 5,
      })
    }

    window.addEventListener('api:error', handler)
    return () => window.removeEventListener('api:error', handler)
  }, [notification])

  return null
}
