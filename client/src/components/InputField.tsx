import type { InputHTMLAttributes } from 'react'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function InputField({ label, type, ...inputProps }: InputFieldProps) {
  const [passwordVisible, setPasswordVisible] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && passwordVisible ? 'text' : type

  return (
    <label className="input-field">
      <span className="input-field__label">{label}</span>
      <span className="input-field__control">
        <input
          {...inputProps}
          type={inputType}
          data-password-visible={isPassword && passwordVisible}
        />
        {isPassword && (
          <button
            type="button"
            className="input-field__toggle"
            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
            aria-pressed={passwordVisible}
            onClick={() => setPasswordVisible((visible) => !visible)}
          >
            {passwordVisible ? (
              <EyeOff aria-hidden="true" size={18} strokeWidth={1.75} />
            ) : (
              <Eye aria-hidden="true" size={18} strokeWidth={1.75} />
            )}
          </button>
        )}
      </span>
    </label>
  )
}
