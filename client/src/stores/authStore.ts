import type { AuthUser } from '#/api/auth'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthStore {
  user: AuthUser | null
  lastAuthenticatedEmail: string | null
  setUser: (user: AuthUser) => void
  setLastAuthenticatedEmail: (email: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      lastAuthenticatedEmail: null,

      setUser: (user) => {
        set({
          user,
          lastAuthenticatedEmail: user.email,
        })
      },

      setLastAuthenticatedEmail: (email) => {
        set({ lastAuthenticatedEmail: email })
      },

      clearAuth: () => {
        set({ user: null })
      },
    }),
    {
      name: 'forever-artifacts-auth',
      partialize: (state) => ({
        lastAuthenticatedEmail: state.lastAuthenticatedEmail,
      }),
    },
  ),
)
