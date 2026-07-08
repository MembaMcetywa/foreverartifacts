import type { ButtonHTMLAttributes } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  type = 'button',
}: ButtonProps) {
  return (
    <button
      type={type}
      className="button"
      data-variant={variant}
      disabled={disabled || loading}
      aria-label="button"
      aria-busy={loading || undefined}
    >
      {children}
    </button>
  )
}
