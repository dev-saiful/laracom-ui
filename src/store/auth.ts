import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { setAuthCookies, clearAuthCookies, clearSessionId } from '@/lib/cookies'

interface AuthState {
  user: User | null
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
      isAuthenticated: false,
      isAdmin: false,

      setAuth: (user, accessToken, refreshToken) => {
        // Store tokens in secure cookies; clear the guest session cookie
        setAuthCookies(accessToken, refreshToken)
        clearSessionId()
        set({
          user,
          isAuthenticated: true,
          isAdmin: user.role === 'admin',
        })
      },

      clearAuth: () => {
        // Remove tokens and guest session from cookies
        clearAuthCookies()
        clearSessionId()
        set({ user: null, isAuthenticated: false, isAdmin: false })
      },

      setUser: (user) => set({ user, isAdmin: user.role === 'admin' }),
    }),
    {
      name: 'laracom-auth',
      // Only persist non-sensitive UI state — tokens live in cookies
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
    },
  ),
)
