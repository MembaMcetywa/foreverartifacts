import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { FormEvent, useState } from 'react'

import { login } from '#/api/auth'
import { Button } from '#/components/Button'
import { InputField } from '#/components/InputField'
import { useAuthStore } from '#/stores/authStore'
import {
  hasAuthPassword,
  isValidAuthEmail,
  normalizeAuthEmail,
} from '#/utils/auth-validation'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : '/create',
  }),
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { redirect } = Route.useSearch()
  const safeRedirect = getSafeRedirectPath(redirect)
  const lastAuthenticatedEmail = useAuthStore(
    (state) => state.lastAuthenticatedEmail,
  )
  const setUser = useAuthStore((state) => state.setUser)
  const [email, setEmail] = useState(lastAuthenticatedEmail ?? '')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const canSubmit = isValidAuthEmail(email) && hasAuthPassword(password)

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('')
    setSubmitting(true)

    try {
      const user = await login({ email: normalizeAuthEmail(email), password })
      setUser(user)
      await navigate({ to: safeRedirect as '/' })
    } catch {
      setStatus('Login failed. Check your email and password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="login-heading">
        <Link to="/" className="auth-brand" aria-label="Forever Artifacts home">
          <img src="/brand/fa-wordmark-stacked.svg" alt="Forever Artifacts" />
        </Link>
        <div className="auth-copy">
          <h1 id="login-heading">Login</h1>
          <p>Login to continue where you left off</p>
        </div>
        <form className="auth-form" onSubmit={submitLogin}>
          <InputField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            required
            onChange={(event) => setEmail(event.target.value)}
          />
          <InputField
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            required
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button type="submit" disabled={submitting || !canSubmit}>
            {submitting ? 'Logging you in...' : 'Login'}
          </Button>
          <p className="auth-status" role="status">
            {status}
          </p>
        </form>
        <footer className="auth-links auth-links--split">
          <Link to="/forgot-password">Forgot password?</Link>
          <span>
            No account? <Link to="/signup">Sign up</Link>
          </span>
        </footer>
      </section>
    </main>
  )
}

function getSafeRedirectPath(redirect: string): string {
  if (!redirect.startsWith('/') || redirect.startsWith('//')) {
    return '/create'
  }

  return redirect
}
