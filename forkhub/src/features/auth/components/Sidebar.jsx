import { useNavigate } from 'react-router-dom'

export default function Sidebar() {
  const navigate = useNavigate()

  return (
    <div className="sidebar">
      <h2>ForkHub</h2>

      <button onClick={() => navigate('/dashboard')}>Dashboard</button>
      <button onClick={() => navigate('/users')}>Users</button>
      <button onClick={() => navigate('/menu')}>Menu</button>
      <button onClick={() => navigate('/cart')}>Cart</button>
      <button onClick={() => navigate('/orders')}>Orders</button>
      <button onClick={() => navigate('/tracking')}>Tracking</button>
      <button onClick={() => navigate('/admin')}>Admin</button>
    </div>
  )
}