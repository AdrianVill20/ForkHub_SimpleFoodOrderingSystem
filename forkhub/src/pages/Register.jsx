import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function RegisterModal({ nextPath, onClose, onDismissRoot, overlayExtraClass }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const overlayCls = overlayExtraClass ? `cat-modal-overlay ${overlayExtraClass}` : 'cat-modal-overlay'

  return (
    <div
      className={overlayCls}
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="cat-modal-box register-premium-modal"
        style={{ width: 'min(740px, 100%)' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="register-premium-header">
          <div className="register-premium-header-main">
            <p className="register-premium-eyebrow">Join ForkHub</p>
            <h2 id="register-modal-title" className="register-premium-title">
              Create your profile
            </h2>
            <p className="register-premium-lead">
              Save your details once—reorder faster, track deliveries, and manage every order in one place.
            </p>
            <ul className="register-premium-highlights" aria-label="Why create a profile">
              <li>
                <span className="register-premium-hi-icon" aria-hidden>✓</span>
                Faster checkout with saved contact info
              </li>
              <li>
                <span className="register-premium-hi-icon" aria-hidden>✓</span>
                Live order status &amp; history
              </li>
              <li>
                <span className="register-premium-hi-icon" aria-hidden>✓</span>
                Pickup or delivery preferences remembered
              </li>
            </ul>
          </div>
          <button type="button" className="cat-modal-close register-premium-close" onClick={onClose} aria-label="Close registration">
            ×
          </button>
        </header>
        <div className="cat-modal-body register-premium-body">
          <RegisterFormInner nextPath={nextPath} onClose={onClose} onDismissRoot={onDismissRoot} />
        </div>
      </div>
    </div>
  )
}

function RegisterFormInner({ nextPath, onClose, onDismissRoot }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminCode, setAdminCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()
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
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          email,
          password,
          ...(isAdmin ? { adminCode } : {}),
        }),
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
        setErrorMessage('Account created, but auto-login failed. Please sign in from the login form.')
        onClose?.()
        return
      }

      localStorage.setItem('login', 'true')
      localStorage.setItem('auth_token', loginPayload.token)
      localStorage.setItem('auth_user', JSON.stringify(loginPayload.user))
      window.dispatchEvent(new CustomEvent('auth-changed', {
        detail: {
          authenticated: true,
          token: loginPayload.token,
          user: loginPayload.user,
        },
      }))
      const role = loginPayload.user?.role
      onDismissRoot?.()
      navigate(role === 'admin' ? '/admin' : nextPath)
    } catch {
      setErrorMessage('Cannot connect to server. Make sure backend is running.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="form-panel register-modal-form-panel register-premium-form">
      <button type="button" className="register-premium-signin-link" onClick={() => onClose?.()}>
        ← Back to sign in
      </button>

      <section className="register-premium-section" aria-labelledby="reg-section-name">
        <h3 id="reg-section-name" className="register-premium-section-title">
          About you
        </h3>
        <p className="register-premium-section-hint">We’ll greet you by name on orders and receipts.</p>
        <div className="register-premium-grid2">
          <div>
            <label htmlFor="reg-first" className="register-premium-label">
              First name
            </label>
            <input
              id="reg-first"
              className="field register-premium-field"
              autoComplete="given-name"
              placeholder="Alex"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="reg-last" className="register-premium-label">
              Last name
            </label>
            <input
              id="reg-last"
              className="field register-premium-field"
              autoComplete="family-name"
              placeholder="Rivera"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="register-premium-section" aria-labelledby="reg-section-contact">
        <h3 id="reg-section-contact" className="register-premium-section-title">
          Contact &amp; updates
        </h3>
        <p className="register-premium-section-hint">Use an email you check often—we’ll send order confirmations here.</p>
        <label htmlFor="reg-email" className="register-premium-label">
          Email address
        </label>
        <input
          id="reg-email"
          className="field register-premium-field"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <label htmlFor="reg-email2" className="register-premium-label">
          Confirm email
        </label>
        <input
          id="reg-email2"
          className="field register-premium-field"
          type="email"
          autoComplete="email"
          placeholder="Re-enter your email"
          value={confirmEmail}
          onChange={(event) => setConfirmEmail(event.target.value)}
        />
        <label htmlFor="reg-phone" className="register-premium-label">
          Primary phone <span className="register-premium-opt">optional but recommended</span>
        </label>
        <input
          id="reg-phone"
          className="field register-premium-field"
          type="tel"
          autoComplete="tel"
          placeholder="0917 123 4567"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </section>

      <section className="register-premium-section register-premium-section--security" aria-labelledby="reg-section-pw">
        <h3 id="reg-section-pw" className="register-premium-section-title">
          Secure sign-in
        </h3>
        <p className="register-premium-section-hint">
          Choose a strong password. You’ll use this with your email whenever you order.
        </p>
        <label htmlFor="reg-pw" className="register-premium-label">
          Password
        </label>
        <input
          id="reg-pw"
          className="field register-premium-field"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <label htmlFor="reg-pw2" className="register-premium-label">
          Confirm password
        </label>
        <input
          id="reg-pw2"
          className="field register-premium-field"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </section>

      <section className="register-premium-section register-premium-section--admin" aria-labelledby="reg-section-admin">
        <div className="register-premium-admin-card">
          <h3 id="reg-section-admin" className="register-premium-admin-title">
            Team access <span className="register-premium-opt">optional</span>
          </h3>
          <p className="register-premium-admin-desc">Only for ForkHub staff who have been given an admin code.</p>
          <label className="register-premium-checkbox">
            <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
            <span>I am registering as an administrator</span>
          </label>
          {isAdmin && (
            <>
              <label htmlFor="reg-admin-code" className="register-premium-label register-premium-label--indent">
                Admin secret code
              </label>
              <input
                id="reg-admin-code"
                className="field register-premium-field"
                type="password"
                placeholder="Enter the code provided by your lead"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
              />
            </>
          )}
        </div>
      </section>

      {errorMessage ? (
        <p className="register-premium-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="register-premium-actions">
        <button type="button" className="btn-red register-premium-submit" onClick={register} disabled={isSubmitting}>
          {isSubmitting ? 'Creating your account…' : 'Create my ForkHub profile'}
        </button>
        <p className="register-premium-footnote">By continuing you agree to use this account responsibly. No spam—we only email about your orders.</p>
      </div>
    </div>
  )
}
