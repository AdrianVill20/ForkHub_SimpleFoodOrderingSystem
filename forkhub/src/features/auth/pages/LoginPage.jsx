import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const login = () => {
    if (username === 'lyka' && password === 'password') {
      localStorage.setItem('login', true)
      navigate('/dashboard')
    } else {
      alert('Wrong credentials')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Login</h1>

        <input onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
        <input onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" />

        <button onClick={login}>Login</button>
      </div>
    </div>
  )
}