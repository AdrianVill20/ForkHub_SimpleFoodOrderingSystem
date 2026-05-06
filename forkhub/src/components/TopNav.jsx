import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthModal } from '../context/AuthModalContext'

export default function TopNav({ signedIn = false }) {
  const { openAuthModal } = useAuthModal()
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const syncUser = () => {
      const raw = localStorage.getItem('auth_user')
      if (!raw) {
        setCurrentUser(null)
        return
      }

      try {
        setCurrentUser(JSON.parse(raw))
      } catch {
        setCurrentUser(null)
      }
    }

    syncUser()
    window.addEventListener('auth-changed', syncUser)
    window.addEventListener('storage', syncUser)

    return () => {
      window.removeEventListener('auth-changed', syncUser)
      window.removeEventListener('storage', syncUser)
    }
  }, [])

  const displayName = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ').trim()
  const emailName = currentUser?.email ? currentUser.email.split('@')[0] : ''
  const greeting = displayName || emailName || 'User'

  return (
    <header className="top-nav">
      <Link className="top-nav-item" to="/">
        Order Online
      </Link>
      <Link className="top-nav-item" to="/menu">
        Menu
      </Link>
      <Link className="top-nav-item" to="/orders">
        Promotions & E-Vouchers
      </Link>
      <Link className="top-nav-item" to="/tracking">
        Tracker
      </Link>

      <div className="top-nav-right">
        {signedIn ? (
          <Link className="top-nav-item" to="/dashboard">
            {`Hi, ${greeting}`}
          </Link>
        ) : (
          <button
            type="button"
            className="top-nav-item"
            style={{
              background: 'none',
              border: 'none',
              font: 'inherit',
              color: 'inherit',
              cursor: 'pointer',
              padding: 0,
              textTransform: 'inherit',
            }}
            onClick={() => openAuthModal({ view: 'login', nextPath: '/menu' })}
          >
            Sign In
          </button>
        )}
        <Link className="top-nav-item" to="/cart">
          Cart
        </Link>
      </div>
    </header>
  )
}
