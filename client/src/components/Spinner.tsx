import type { ComponentProps } from 'react'
import { LoaderIcon } from 'lucide-react'

export interface SpinnerProps extends ComponentProps<'svg'> {
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Spinner({
  label,
  size = 'md',
  className,
  ...props
}: SpinnerProps) {
  return (
    <LoaderIcon
      {...props}
      className={['spinner', className].filter(Boolean).join(' ')}
      data-size={size}
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      strokeWidth={2}
    />
  )
}
