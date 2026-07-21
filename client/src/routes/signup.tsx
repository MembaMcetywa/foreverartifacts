import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import type { FormEvent} from 'react';
import { useState } from 'react'

import { signUp } from '#/api/auth'
import { Button } from '#/components/Button'
import { InputField } from '#/components/InputField'
import { useAuthStore } from '#/stores/authStore'
import {
  isValidAuthEmail,
  isValidAuthPassword,
  normalizeAuthEmail,
} from '#/utils/auth-validation'

export const Route = createFileRoute('/signup')({
  component: SignupPage,
})

function SignupPage() {
  const navigate = useNavigate()
  const setLastAuthenticatedEmail = useAuthStore(
    (state) => state.setLastAuthenticatedEmail,
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword
  const canSubmit =
    isValidAuthEmail(email) && isValidAuthPassword(password) && passwordsMatch

  async function submitSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('')

    if (!canSubmit) {
      setStatus('Enter matching valid passwords.')
      return
    }

    setSubmitting(true)

    try {
      const normalizedEmail = normalizeAuthEmail(email)

      await signUp({ email: normalizedEmail, password })
      setLastAuthenticatedEmail(normalizedEmail)
      await navigate({
        to: '/confirm',
        search: { email: normalizedEmail },
      })
    } catch {
      setStatus('Sign up failed. Check the details and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="signup-heading">
        <Link to="/" className="auth-brand" aria-label="Forever Artifacts home">
          <img src="/brand/fa-wordmark-stacked.svg" alt="Forever Artifacts" />
        </Link>
        <div className="auth-copy">
          <h1 id="signup-heading">Create an account</h1>
          <p>Create an account to get started on crafting your forever artifacts</p>
        </div>
        <form className="auth-form" onSubmit={submitSignup}>
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
            autoComplete="new-password"
            value={password}
            required
            onChange={(event) => setPassword(event.target.value)}
          />
          <InputField
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            required
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="auth-field-status" role="status">
              Passwords do not match.
            </p>
          )}
          <p className="auth-fineprint">
            By signing up, you agree to Forever Artifacts’{' '}
            <Link to="/terms">Terms of Service</Link> and{' '}
            <Link to="/privacy">Privacy Policy</Link>
          </p>
          <Button
            type="submit"
            loading={submitting}
            disabled={submitting || !canSubmit}
          >
            Create account
          </Button>
          <p className="auth-status" role="status">
            {status}
          </p>
        </form>
        <footer className="auth-links">
          <span>
            Have an account? <Link to="/login">Login</Link>
          </span>
        </footer>
      </section>
    </main>
  )
}
