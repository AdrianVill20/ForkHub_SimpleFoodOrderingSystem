import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const navigate = useNavigate()

  const cards = [
    { title: 'Users', path: '/users' },
    { title: 'Menu', path: '/menu' },
    { title: 'Cart', path: '/cart' },
    { title: 'Orders', path: '/orders' },
    { title: 'Tracking', path: '/tracking' },
    { title: 'Admin', path: '/admin' }
  ]

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <Navbar />

        <div className="dashboard">
          <h1>Dashboard</h1>

          <div className="grid">
            {cards.map((c, i) => (
              <div key={i} className="feature-card" onClick={() => navigate(c.path)}>
                <h3>{c.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}