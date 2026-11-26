import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthModal } from '../contexts/useAuthModal'
import { getCartCount } from '../services/cartService'
import { ROLES } from '../constants'
import { formatName } from '../utils/formatName'

// Admin pages, shown in the top bar instead of the customer links
const ADMIN_LINKS = [
  { view: 'list',   label: 'Menu',     to: '/admin' },
  { view: 'add',    label: 'Add Item', to: '/admin?view=add' },
  { view: 'orders', label: 'Orders',   to: '/admin?view=orders' },
  { view: 'users',  label: 'Users',    to: '/admin?view=users' },
]

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

  const displayName = formatName(currentUser?.firstName, currentUser?.lastName)
  const emailName = currentUser?.email ? currentUser.email.split('@')[0] : ''
  const greeting = displayName || emailName || 'User'
  const isSignedIn = Boolean(currentUser)
  // Admins manage the shop; they don't browse, order or track like customers
  const isAdmin = currentUser?.role === ROLES.ADMIN
  const adminView = location.pathname === '/admin'
    ? new URLSearchParams(location.search).get('view') || 'list'
    : null

  return (
    <header className="top-nav">
      <Link className="top-nav-logo-link" to={isAdmin ? '/admin' : '/'}>
        <span className="top-nav-brand" aria-label="ForkHub">
          <svg className="top-nav-brand-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 2v7m4-7v7M9 2v20m7-20v6a3 3 0 0 0 6 0V2m-3 9v11" />
          </svg>
          <span>ForkHub</span>
        </span>
      </Link>

      <nav className="top-nav-links">
        {/* Admins get their own pages; customers and guests get the shop links */}
        {isAdmin ? (
          ADMIN_LINKS.map((link) => (
            <Link
              key={link.view}
              className={`top-nav-item ${adminView === link.view ? 'active' : ''}`}
              to={link.to}
            >
              {link.label}
            </Link>
          ))
        ) : (
          <>
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
          </>
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
        {!isAdmin && (
          <Link className="top-nav-item top-nav-cart" to="/cart" style={{ position: 'relative' }}>
            Cart
            {cartCount > 0 && (
              <span style={{
               position: 'absolute', top: -8, right: -12,
                background: 'var(--color-primary-container)', color: 'var(--color-surface-container-lowest)',
                borderRadius: '50%', fontSize: 10, fontWeight: 800,
                minWidth: 18, height: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px', pointerEvents: 'none',
              }}>
                {cartCount}
              </span>
            )}
          </Link>
        )}
      </div>
    </header>
  )
}
