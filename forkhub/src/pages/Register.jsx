import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'

export default function Register() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
  const nextPath = location.state?.nextPath || '/menu'

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
        navigate('/login')
        return
      }

      localStorage.setItem('login', 'true')
      localStorage.setItem('auth_token', loginPayload.token)
      localStorage.setItem('auth_user', JSON.stringify(loginPayload.user))
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
      <main className="content-wrap">
        <h1 className="section-title">Create ForkHub&apos;s Profile</h1>
        <p className="muted" style={{ textAlign: 'center', marginBottom: 24 }}>
          Fill out the form below to create a ForkHub profile and start ordering.
        </p>

        <div className="form-panel" style={{ maxWidth: 700 }}>
          <label>First Name</label>
          <input className="field" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
          <label>Last Name</label>
          <input className="field" value={lastName} onChange={(event) => setLastName(event.target.value)} />
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

          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <button className="btn-red" onClick={register} disabled={isSubmitting}>
              {isSubmitting ? 'Creating Account...' : 'Continue'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}