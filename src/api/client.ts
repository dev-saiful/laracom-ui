import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { getErrorMessage } from '@/lib/error'
import {
  getAccessToken,
  getRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  getOrCreateSessionId,
} from '@/lib/cookies'

const BASE_URL = '/api'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 15000,
})

// ─── Request interceptor ───────────────────────────────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()

  if (token) {
    // Authenticated request — attach Bearer token; no session header needed
    config.headers.Authorization = `Bearer ${token}`
  } else {
    // Guest request — attach session ID so the backend can track the guest cart
    config.headers['X-Session-ID'] = getOrCreateSessionId()
  }

  return config
})

// ─── Response interceptor: auto-refresh on 401 ────────────────────────────
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

    // ── Auto-refresh on 401 ───────────────────────────────────────────────
    if (status === 401 && !originalRequest._retry) {
      const refreshToken = getRefreshToken()

      if (!refreshToken) {
        clearAuthCookies()
        // Lazily import to avoid circular dependency
        const { useAuthStore } = await import('@/store/auth')
        useAuthStore.getState().clearAuth()
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
        const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, {
          refresh_token: refreshToken,
        })
        const newAccessToken: string = data.data.access_token
        const newRefreshToken: string = data.data.refresh_token
        setAuthCookies(newAccessToken, newRefreshToken)
        processQueue(null, newAccessToken)
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return apiClient(originalRequest)
      } catch (err) {
        processQueue(err, null)
        clearAuthCookies()
        const { useAuthStore } = await import('@/store/auth')
        useAuthStore.getState().clearAuth()
        window.location.href = '/auth/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    // ── Global error notifications ────────────────────────────────────────
    if (status === 403) {
      window.dispatchEvent(new CustomEvent('api:error', {
        detail: { message: getErrorMessage(error, 'You do not have permission to do that.'), status },
      }))
    }

    if (status === 429) {
      window.dispatchEvent(new CustomEvent('api:error', {
        detail: { message: getErrorMessage(error, 'Too many requests. Please slow down.'), status },
      }))
    }

    if (status && status >= 500) {
      window.dispatchEvent(new CustomEvent('api:error', {
        detail: { message: getErrorMessage(error, 'A server error occurred. Please try again later.'), status },
      }))
    }

    if (!error.response) {
      window.dispatchEvent(new CustomEvent('api:error', {
        detail: { message: getErrorMessage(error), status: 0 },
      }))
    }

    return Promise.reject(error)
  },
)

export default apiClient
