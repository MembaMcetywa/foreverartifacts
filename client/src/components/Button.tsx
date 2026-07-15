import type { ButtonHTMLAttributes } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  loading?: boolean
  onClick?: () => void
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  onClick,
  type = 'button',
  'aria-label': ariaLabel,
}: ButtonProps) {
  return (
    <button
      type={type}
      className="button"
      data-variant={variant}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
