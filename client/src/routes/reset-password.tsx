import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import type { FormEvent} from 'react';
import { useState } from 'react'

import { resetPassword } from '#/api/auth'
import { Button } from '#/components/Button'
import { InputField } from '#/components/InputField'
import { useAuthStore } from '#/stores/authStore'
import {
  isValidAuthCode,
  isValidAuthEmail,
  isValidAuthPassword,
  normalizeAuthCode,
  normalizeAuthEmail,
} from '#/utils/auth-validation'

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === 'string' ? search.email : '',
  }),
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const navigate = useNavigate()
  const { email: searchEmail } = Route.useSearch()
  const setLastAuthenticatedEmail = useAuthStore(
    (state) => state.setLastAuthenticatedEmail,
  )
  const [email, setEmail] = useState(searchEmail)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const canSubmit =
    isValidAuthEmail(email) &&
    isValidAuthCode(code) &&
    isValidAuthPassword(password)

  async function submitResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('')
    setSubmitting(true)

    try {
      const normalizedEmail = normalizeAuthEmail(email)

      await resetPassword({
        email: normalizedEmail,
        code: normalizeAuthCode(code),
        password,
      })
      setLastAuthenticatedEmail(normalizedEmail)
      await navigate({ to: '/login' })
    } catch {
      setStatus('Password reset failed. Check the code and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="reset-heading">
        <Link to="/" className="auth-brand" aria-label="Forever Artifacts home">
          <img src="/brand/fa-wordmark-stacked.svg" alt="Forever Artifacts" />
        </Link>
        <div className="auth-copy">
          <h1 id="reset-heading">Choose a new password</h1>
          <p>Use the reset code from your email.</p>
        </div>
        <form className="auth-form" onSubmit={submitResetPassword}>
          <InputField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            required
            onChange={(event) => setEmail(event.target.value)}
          />
          <InputField
            label="Code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            required
            onChange={(event) => setCode(event.target.value)}
          />
          <InputField
            label="New password"
            type="password"
            autoComplete="new-password"
            value={password}
            required
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button type="submit" disabled={submitting || !canSubmit}>
            {submitting ? 'Saving password...' : 'Save new password'}
          </Button>
          <p className="auth-status" role="status">
            {status}
          </p>
        </form>
        <footer className="auth-links">
          <Link to="/login">Back to sign in</Link>
        </footer>
      </section>
    </main>
  )
}
