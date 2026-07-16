import { redirect } from '@tanstack/react-router'

import { getCurrentUser, refreshSession } from '#/api/auth'
import { ApiError } from '#/api/client'
import { useAuthStore } from '#/stores/authStore'

export async function requireAuth(locationHref: string): Promise<void> {
  const recovered = await tryRequireAuth()

  if (recovered) {
    return
  }

  await delay(750)

  const recoveredAfterRetry = await tryRequireAuth()

  if (recoveredAfterRetry) {
    return
  }

  useAuthStore.getState().clearAuth()
  throw redirect({
    to: '/login',
    search: {
      redirect: locationHref,
    },
  })
}

async function tryRequireAuth(): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    useAuthStore.getState().setUser(user)
    return true
  } catch (error) {
    if (!isUnauthorized(error)) {
      throw error
    }

    try {
      await refreshSession()
      const user = await getCurrentUser()
      useAuthStore.getState().setUser(user)
      return true
    } catch (refreshError) {
      if (!isUnauthorized(refreshError)) {
        throw refreshError
      }

      return false
    }
  }
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds))
}
