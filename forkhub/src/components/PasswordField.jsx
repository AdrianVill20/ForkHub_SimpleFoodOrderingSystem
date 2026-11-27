import { useState } from 'react'

export default function PasswordField({
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  autoComplete,
  className = 'field',
  ...inputProps
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="password-field-wrap">
      <input
        {...inputProps}
        id={id}
        name={name}
        className={`${className} password-field-input`}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
      />
      <button
        type="button"
        className="password-eye-button"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 4.2A10.8 10.8 0 0112 4c5.5 0 9.5 5.2 10 6-.2.4-1.1 1.5-2.4 2.7M6.2 6.2C3.8 7.9 2.3 10 2 10c.5.8 4.5 6 10 6a9.7 9.7 0 003.3-.6" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M2 12c.5-.8 4.5-6 10-6s9.5 5.2 10 6c-.5.8-4.5 6-10 6S2.5 12.8 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  )
}
