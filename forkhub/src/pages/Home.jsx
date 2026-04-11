import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="home">
      <h1>ForkHub</h1>
      <p>Restaurant Management System</p>
      <button onClick={() => navigate('/login')}>Get Started</button>
    </div>
  )
}