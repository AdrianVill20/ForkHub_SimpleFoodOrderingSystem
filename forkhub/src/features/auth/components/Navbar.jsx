import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()

  const logout = () => {
    localStorage.removeItem('login')
    navigate('/login')
  }

  return (
    <div className="navbar">
      <h3>Welcome to ForkHub, Lyka!</h3>
      <button onClick={logout}>Logout</button>
    </div>
  )
}