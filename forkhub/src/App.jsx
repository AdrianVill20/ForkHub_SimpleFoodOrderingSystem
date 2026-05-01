import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import LoginPage from './pages/LoginPage'
import Register from './pages/Register'
import DashboardPage from './pages/DashboardPage'
import MenuPage from './pages/MenuPage'
import CartPage from './pages/CartPage'
import OrderPage from './pages/OrderPage'
import TrackingPage from './pages/TrackingPage'
import AdminPage from './pages/AdminPage'
import UserPage from './pages/UserPage'
import './App.css'

function ProtectedRoute({ isAuthenticated, children }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

function PublicOnlyRoute({ isAuthenticated, children }) {
  if (isAuthenticated) {
    return <Navigate to="/menu" replace />
  }

  return children
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

  const verifySession = useCallback(async (token) => {
    if (!token) {
      setIsAuthenticated(false)
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
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
    const handleAuthChanged = () => {
      const token = localStorage.getItem('auth_token')
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
    return null
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={(
            <PublicOnlyRoute isAuthenticated={isAuthenticated}>
              <LoginPage />
            </PublicOnlyRoute>
          )}
        />
        <Route
          path="/register"
          element={(
            <PublicOnlyRoute isAuthenticated={isAuthenticated}>
              <Register />
            </PublicOnlyRoute>
          )}
        />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <DashboardPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/menu"
          element={(
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <MenuPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/users"
          element={(
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <DashboardPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/cart"
          element={(
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <CartPage />
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
            <ProtectedRoute isAuthenticated={isAuthenticated}>
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
    </BrowserRouter>
  )
}

export default App