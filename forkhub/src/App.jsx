import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom'
import { AuthModalProvider, useAuthModal } from './contexts/AuthModalContext'
import Home from './pages/Home'
import ProfilePage from './pages/ProfilePage'
import MenuPage from './pages/MenuPage'
import CartPage from './pages/CartPage'
import OrderPage from './pages/OrderPage'
import TrackingPage from './pages/TrackingPage'
import AdminPage from './pages/AdminPage'
import UserPage from './pages/UserPage'
import './App.css'

function ProtectedRoute({ isAuthenticated, children, requireAdmin = false }) {
  const location = useLocation()

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  if (requireAdmin) {
    const user = (() => { try { return JSON.parse(localStorage.getItem('auth_user')) } catch { return null } })()
    if (user?.role !== 'admin') {
      return <Navigate to="/menu" replace />
    }
  }

  return children
}

function PublicOnlyRoute({ isAuthenticated, children }) {
  if (isAuthenticated) {
    return <Navigate to="/menu" replace />
  }

  return children
}

function LoginBookmarkRoute({ registerPreferred }) {
  const location = useLocation()
  const { openAuth } = useAuthModal()
  const ran = useRef(false)

  useLayoutEffect(() => {
    if (ran.current) return
    ran.current = true
    openAuth({
      nextPath: location.state?.nextPath || '/',
      mode: registerPreferred ? 'register' : 'login',
    })
  }, [location.state?.nextPath, openAuth, registerPreferred])

  return <Navigate to="/" replace />
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

  const verifySession = useCallback(async (token) => {
    if (!token) {
      localStorage.removeItem('auth_user')
      localStorage.removeItem('login')
      setIsAuthenticated(false)
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error('Session token is invalid')
      }

      const payload = await response.json()
      localStorage.setItem('auth_user', JSON.stringify(payload.user))
      localStorage.setItem('login', 'true')
      setIsAuthenticated(true)
    } catch {
      localStorage.removeItem('login')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      setIsAuthenticated(false)
    } finally {
      clearTimeout(timeoutId)
    }
  }, [apiBaseUrl])

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const check = async () => {
      await verifySession(token)
      setIsCheckingAuth(false)
    }

    check()
  }, [verifySession])

  useEffect(() => {
    const handleAuthChanged = (event) => {
      const token = event?.detail?.token ?? localStorage.getItem('auth_token')

      if (event?.detail?.authenticated) {
        const user = event.detail.user ?? (() => {
          try {
            return JSON.parse(localStorage.getItem('auth_user'))
          } catch {
            return null
          }
        })()

        if (user) {
          localStorage.setItem('auth_user', JSON.stringify(user))
          if (token) {
            localStorage.setItem('auth_token', token)
          }
          setIsAuthenticated(true)
          return
        }
      }

      verifySession(token)
    }

    window.addEventListener('auth-changed', handleAuthChanged)
    window.addEventListener('storage', handleAuthChanged)

    return () => {
      window.removeEventListener('auth-changed', handleAuthChanged)
      window.removeEventListener('storage', handleAuthChanged)
    }
  }, [verifySession])

  if (isCheckingAuth) {
    return (
      <div className="page">
        <main className="content-wrap">
          <div style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ fontSize: 18, color: '#555' }}>Loading your session…</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <AuthModalProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route
          path="/login"
          element={(
            <PublicOnlyRoute isAuthenticated={isAuthenticated}>
              <LoginBookmarkRoute registerPreferred={false} />
            </PublicOnlyRoute>
          )}
        />
        <Route
          path="/register"
          element={(
            <PublicOnlyRoute isAuthenticated={isAuthenticated}>
              <LoginBookmarkRoute registerPreferred />
            </PublicOnlyRoute>
          )}
        />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <ProfilePage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/users"
          element={(
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <ProfilePage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/orders"
          element={(
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <OrderPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/tracking"
          element={(
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <TrackingPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin"
          element={(
            <ProtectedRoute isAuthenticated={isAuthenticated} requireAdmin>
              <AdminPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/profile"
          element={(
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <UserPage />
            </ProtectedRoute>
          )}
        />
      </Routes>
      </AuthModalProvider>
    </BrowserRouter>
  )
}

export default App