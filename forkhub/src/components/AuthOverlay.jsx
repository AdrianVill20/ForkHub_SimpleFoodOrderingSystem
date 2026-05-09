import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RegisterModal } from '../pages/Register'

export default function AuthOverlay({ nextPath, initialMode, onDismiss }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()
  const [registerOpen, setRegisterOpen] = useState(initialMode === 'register')
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

  useEffect(() => {
    if (registerOpen) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDismiss, registerOpen])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const login = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Email and password are required.')
      return
    }

    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        setErrorMessage(payload.message || 'Invalid email or password.')
        return
      }

      localStorage.setItem('login', 'true')
      localStorage.setItem('auth_token', payload.token)
      localStorage.setItem('auth_user', JSON.stringify(payload.user))
      window.dispatchEvent(new CustomEvent('auth-changed', {
        detail: {
          authenticated: true,
          token: payload.token,
          user: payload.user,
        },
      }))
      const role = payload.user?.role
      onDismiss()
      navigate(role === 'admin' ? '/admin' : nextPath)
    } catch {
      setErrorMessage('Cannot connect to server. Make sure backend is running.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (registerOpen) {
    return (
      <RegisterModal
        nextPath={nextPath}
        onClose={() => setRegisterOpen(false)}
        onDismissRoot={onDismiss}
      />
    )
  }

  return (
    <div
      className="auth-shell-overlay cat-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-overlay-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onDismiss()
        }
      }}
    >
      <div
        className="modal-card auth-shell-card"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button type="button" className="auth-shell-close cat-modal-close" onClick={onDismiss} aria-label="Close">
          ×
        </button>
        <h1 id="auth-overlay-title" style={{ margin: '0 24px 0 0', fontSize: 'clamp(1.35rem, 4vw, 2.55rem)', textTransform: 'uppercase', lineHeight: 1.1 }}>
          Sign it to your ForkHub&apos;s profile
        </h1>
        <p className="muted" style={{ marginTop: 12 }}>
          Don&apos;t have one?{' '}
          <button
            type="button"
            style={{ color: '#98008f', fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none', padding: 0, font: 'inherit' }}
            onClick={() => setRegisterOpen(true)}
          >
            Create One
          </button>
        </p>

        <label>Email</label>
        <input className="field" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label>Password</label>
        <input className="field" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

        {errorMessage ? (
          <p className="muted" style={{ color: '#c62828', marginTop: 10 }}>
            {errorMessage}
          </p>
        ) : null}

        <button className="btn-purple" style={{ width: '100%', borderRadius: 10, marginTop: 10 }} type="button" onClick={login} disabled={isSubmitting}>
          {isSubmitting ? 'Signing In...' : 'Sign In'}
        </button>
      </div>
    </div>
  )
}
