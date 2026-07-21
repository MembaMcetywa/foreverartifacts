import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import type { FormEvent} from 'react';
import { useState } from 'react'

import { forgotPassword } from '#/api/auth'
import { Button } from '#/components/Button'
import { InputField } from '#/components/InputField'
import { useAuthStore } from '#/stores/authStore'
import {
  isValidAuthEmail,
  normalizeAuthEmail,
} from '#/utils/auth-validation'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const lastAuthenticatedEmail = useAuthStore(
    (state) => state.lastAuthenticatedEmail,
  )
  const setLastAuthenticatedEmail = useAuthStore(
    (state) => state.setLastAuthenticatedEmail,
  )
  const [email, setEmail] = useState(lastAuthenticatedEmail ?? '')
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const canSubmit = isValidAuthEmail(email)

  async function submitForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('')
    setSubmitting(true)

    try {
      const normalizedEmail = normalizeAuthEmail(email)

      await forgotPassword(normalizedEmail)
      setLastAuthenticatedEmail(normalizedEmail)
      await navigate({
        to: '/reset-password',
        search: { email: normalizedEmail },
      })
    } catch {
      setStatus('Password reset could not be started. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="forgot-heading">
        <Link to="/" className="auth-brand" aria-label="Forever Artifacts home">
          <img src="/brand/fa-wordmark-stacked.svg" alt="Forever Artifacts" />
        </Link>
        <div className="auth-copy">
          <h1 id="forgot-heading">Reset your password</h1>
          <p>If the account exists, a reset code will be sent.</p>
        </div>
        <form className="auth-form" onSubmit={submitForgotPassword}>
          <InputField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            required
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button
            type="submit"
            loading={submitting}
            disabled={submitting || !canSubmit}
          >
            Send reset code
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
