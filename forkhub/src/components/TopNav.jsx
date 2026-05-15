import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthModal } from '../contexts/AuthModalContext'
import logo from '../assets/logo.png'
import { getCartCount } from '../services/cartService'

export default function TopNav() {
  const [currentUser, setCurrentUser] = useState(null)
  const [cartCount, setCartCount] = useState(getCartCount())
  const location = useLocation()
  const { openAuth } = useAuthModal()

  useEffect(() => {
    const syncUser = () => {
      const token = localStorage.getItem('auth_token')
      const raw   = localStorage.getItem('auth_user')
      if (!token || !raw) { setCurrentUser(null); return 
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

  useEffect(() => {
    const onCart = () => setCartCount(getCartCount())
    window.addEventListener('cart-updated', onCart)
    return () => window.removeEventListener('cart-updated', onCart)
  }, [])

  const displayName = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ').trim()
  const emailName = currentUser?.email ? currentUser.email.split('@')[0] : ''
  const greeting = displayName || emailName || 'User'
  const isSignedIn = Boolean(currentUser)

  return (
    <header className="top-nav">
      <Link className="top-nav-logo-link" to="/">
        <img src={logo} alt="ForkHub" className="top-nav-logo" />
      </Link>

      <nav className="top-nav-links">
        <Link className="top-nav-item" to="/">
          Home
        </Link>
        <Link className="top-nav-item" to="/menu">
          Menu
        </Link>
        <Link className="top-nav-item" to="/orders">
          Orders
        </Link>
        <Link className="top-nav-item" to="/tracking">
          Tracker
        </Link>
        {currentUser?.role === 'admin' && (
          <Link className="top-nav-item" to="/admin" style={{ color: '#7ad8dc' }}>
            Admin
          </Link>
        )}
      </nav>

      <div className="top-nav-right">
        {isSignedIn ? (
          <Link className="top-nav-item" to="/dashboard">
            {`Hi, ${greeting}`}
          </Link>
        ) : (
          <button
            type="button"
            className="top-nav-item auth-topnav-signin"
            onClick={() =>
              openAuth({
                nextPath: `${location.pathname}${location.search}`,
              })
            }
          >
            Sign In
          </button>
        )}
        <Link className="top-nav-item top-nav-cart" to="/cart" style={{ position: 'relative' }}>
          Cart
          {cartCount > 0 && (
            <span style={{
             position: 'absolute', top: -8, right: -12,
              background: '#e53e3e', color: '#fff',
              borderRadius: '50%', fontSize: 10, fontWeight: 800,
              minWidth: 18, height: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 3px', pointerEvents: 'none',
            }}>
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
