import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
  const nextPath = location.state?.nextPath || '/menu'

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
      window.dispatchEvent(new Event('auth-changed'))
      navigate(nextPath)
    } catch {
      setErrorMessage('Cannot connect to server. Make sure backend is running.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page">
      <TopNav />
      <div className="content-wrap">
        <div className="modal-card">
          <h1 style={{ margin: 0, fontSize: 46, textTransform: 'uppercase' }}>
            Sign it to your ForkHub&apos;s profile
          </h1>
          <p className="muted" style={{ marginTop: 12 }}>
            Don&apos;t have one?{' '}
            <span
              style={{ color: '#98008f', fontWeight: 700, cursor: 'pointer' }}
              onClick={() => navigate('/register', { state: { nextPath } })}
            >
              Create One
            </span>
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

          <button className="btn-purple" style={{ width: '100%', borderRadius: 10, marginTop: 10 }} onClick={login} disabled={isSubmitting}>
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  )
}