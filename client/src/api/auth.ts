import { apiFetch, throwApiError } from './client'

export interface AuthUser {
  id: string
  email: string
  emailVerified: boolean
}

export interface AuthResponse {
  user: AuthUser
}

export interface EmailPasswordInput {
  email: string
  password: string
}

export interface ConfirmSignUpInput {
  email: string
  code: string
}

export interface ResetPasswordInput extends ConfirmSignUpInput {
  password: string
}

export async function signUp(input: EmailPasswordInput): Promise<void> {
  const response = await apiFetch('/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throwApiError(response, 'Sign up failed.')
  }
}

export async function confirmSignUp(
  input: ConfirmSignUpInput,
): Promise<void> {
  const response = await apiFetch('/auth/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throwApiError(response, 'Confirmation failed.')
  }
}

export async function login(input: EmailPasswordInput): Promise<AuthUser> {
  const response = await apiFetch('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throwApiError(response, 'Login failed.')
  }

  const data = (await response.json()) as AuthResponse

  return data.user
}

export async function logout(): Promise<void> {
  const response = await apiFetch('/auth/logout', {
    method: 'POST',
  })

  if (!response.ok) {
    throwApiError(response, 'Logout failed.')
  }
}

export async function refreshSession(): Promise<void> {
  const response = await apiFetch('/auth/refresh', {
    method: 'POST',
  })

  if (!response.ok) {
    throwApiError(response, 'Session refresh failed.')
  }
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiFetch('/auth/me')

  if (!response.ok) {
    throwApiError(response, 'Authentication is required.')
  }

  const data = (await response.json()) as AuthResponse

  return data.user
}

export async function forgotPassword(email: string): Promise<void> {
  const response = await apiFetch('/auth/forgot-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })

  if (!response.ok) {
    throwApiError(response, 'Password reset failed.')
  }
}

export async function resetPassword(
  input: ResetPasswordInput,
): Promise<void> {
  const response = await apiFetch('/auth/reset-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throwApiError(response, 'Password reset failed.')
  }
}
