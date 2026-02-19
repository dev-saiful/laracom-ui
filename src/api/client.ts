import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { getErrorMessage } from '@/lib/error'

const BASE_URL = '/api'

/**
 * Ensure a stable guest session ID exists in localStorage.
 * This is sent as X-Session-ID on every request so the backend can
 * associate guest carts before the user logs in.
 */
function getOrCreateSessionId(): string {
  let id = localStorage.getItem('session_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('session_id', id)
  }
  return id
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 15000,
})

// ─── Request interceptor: attach access token ─────────────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  // Always send guest session ID — backend ignores it when JWT is present
  const sessionId = getOrCreateSessionId()
  config.headers['X-Session-ID'] = sessionId

  return config
})

// ─── Response interceptor: auto-refresh on 401 ────────────────────────────────
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token!)))
  failedQueue = []
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const status = error.response?.status

    // ── Auto-refresh on 401 ─────────────────────────────────────────────────
    if (status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refresh_token')

      if (!refreshToken) {
        localStorage.clear()
        window.location.href = '/auth/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, { refresh_token: refreshToken })
        const newToken = data.data.access_token
        localStorage.setItem('access_token', newToken)
        localStorage.setItem('refresh_token', data.data.refresh_token)
        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      } catch (err) {
        processQueue(err, null)
        localStorage.clear()
        window.location.href = '/auth/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    // ── Global error notifications for common statuses ──────────────────────
    // 403 — forbidden
    if (status === 403) {
      window.dispatchEvent(new CustomEvent('api:error', {
        detail: { message: getErrorMessage(error, 'You do not have permission to do that.'), status },
      }))
    }

    // 429 — rate limited
    if (status === 429) {
      window.dispatchEvent(new CustomEvent('api:error', {
        detail: { message: getErrorMessage(error, 'Too many requests. Please slow down.'), status },
      }))
    }

    // 500+ — server errors
    if (status && status >= 500) {
      window.dispatchEvent(new CustomEvent('api:error', {
        detail: { message: getErrorMessage(error, 'A server error occurred. Please try again later.'), status },
      }))
    }

    // Network / timeout (no response)
    if (!error.response) {
      window.dispatchEvent(new CustomEvent('api:error', {
        detail: { message: getErrorMessage(error), status: 0 },
      }))
    }

    return Promise.reject(error)
  },
)

export default apiClient
