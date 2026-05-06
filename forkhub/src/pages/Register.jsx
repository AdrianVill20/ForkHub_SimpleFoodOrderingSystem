import { useState } from 'react'

export default function RegisterForm({ nextPath, onSuccess, onRequestLogin, onClose }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

  const register = async () => {
    if (!email.trim() || !confirmEmail.trim() || !password || !confirmPassword) {
      setErrorMessage('Email and password fields are required.')
      return
    }

    if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
      setErrorMessage('Email fields do not match.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Password fields do not match.')
      return
    }

    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const registerResponse = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, phone, email, password }),
      })
      const registerPayload = await registerResponse.json().catch(() => ({}))

      if (!registerResponse.ok) {
        setErrorMessage(registerPayload.message || 'Registration failed.')
        return
      }

      const loginResponse = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const loginPayload = await loginResponse.json().catch(() => ({}))

      if (!loginResponse.ok) {
        setErrorMessage('Account created, but auto-login failed. Please sign in.')
        onRequestLogin()
        return
      }

      localStorage.setItem('login', 'true')
      localStorage.setItem('auth_token', loginPayload.token)
      localStorage.setItem('auth_user', JSON.stringify(loginPayload.user))
      window.dispatchEvent(new Event('auth-changed'))
      onSuccess(nextPath)
    } catch {
      setErrorMessage('Cannot connect to server. Make sure backend is running.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-card register-modal-card">
      <button type="button" className="auth-modal-close" onClick={onClose} aria-label="Close">
        ×
      </button>
      <h1 className="register-modal-title">Create ForkHub&apos;s Profile</h1>
      <p className="muted register-modal-lead">
        Create a profile to start ordering.
      </p>

      <div className="register-modal-fields">
        <div className="register-modal-name-row">
          <div>
            <label>First Name</label>
            <input className="field" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
          </div>
          <div>
            <label>Last Name</label>
            <input className="field" value={lastName} onChange={(event) => setLastName(event.target.value)} />
          </div>
        </div>
        <label>Email Address</label>
        <input className="field" value={email} onChange={(event) => setEmail(event.target.value)} />
        <label>Confirm Email Address</label>
        <input className="field" value={confirmEmail} onChange={(event) => setConfirmEmail(event.target.value)} />
        <label>Primary Phone Number</label>
        <input className="field" value={phone} onChange={(event) => setPhone(event.target.value)} />
        <label>Password</label>
        <input className="field" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <label>Confirm Password</label>
        <input className="field" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />

        {errorMessage ? (
          <p className="muted" style={{ color: '#c62828', marginTop: 10, textAlign: 'center' }}>
            {errorMessage}
          </p>
        ) : null}

        <div className="register-modal-actions">
          <p className="muted register-modal-switch">
            Already have an account?{' '}
            <span
              style={{ color: '#98008f', fontWeight: 700, cursor: 'pointer' }}
              onClick={onRequestLogin}
              onKeyDown={(e) => e.key === 'Enter' && onRequestLogin()}
              role="button"
              tabIndex={0}
            >
              Sign In
            </span>
          </p>
          <button type="button" className="btn-red register-modal-submit" onClick={register} disabled={isSubmitting}>
            {isSubmitting ? 'Creating Account...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
