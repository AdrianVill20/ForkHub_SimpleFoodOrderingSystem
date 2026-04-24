import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const login = () => {
    if (username === 'lyka' && password === 'password') {
      localStorage.setItem('login', true)
      navigate('/dashboard')
    } else {
      alert('Wrong username or password')
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
            <span style={{ color: '#98008f', fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/register')}>
              Create One
            </span>
          </p>

          <label>Email</label>
          <input className="field" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />

          <label>Password</label>
          <input className="field" type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />

          <button className="btn-purple" style={{ width: '100%', borderRadius: 10, marginTop: 10 }} onClick={login}>
            Sign In
          </button>
        </div>
      </div>
    </div>
  )
}