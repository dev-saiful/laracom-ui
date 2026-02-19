import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isAdmin: false,

      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)
        // Clear the guest session_id — the backend has merged the guest cart into
        // the user's cart during login (CartService::mergeGuestCart).
        localStorage.removeItem('session_id')
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isAdmin: user.role === 'admin',
        })
      },

      clearAuth: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isAdmin: false })
      },

      setUser: (user) => set({ user, isAdmin: user.role === 'admin' }),
    }),
    {
      name: 'laracom-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
    },
  ),
)

// Ensure localStorage tokens stay in sync on hydration
const { accessToken, refreshToken } = useAuthStore.getState()
if (accessToken) localStorage.setItem('access_token', accessToken)
if (refreshToken) localStorage.setItem('refresh_token', refreshToken)
