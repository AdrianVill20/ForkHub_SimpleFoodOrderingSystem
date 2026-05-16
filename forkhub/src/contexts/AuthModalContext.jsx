import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import AuthOverlay from '../components/AuthOverlay'

const AuthModalContext = createContext(null)

export function AuthModalProvider({ children }) {
  const [open, setOpen] = useState(false)
  const [nextPath, setNextPath] = useState('/menu')
  const [initialMode, setInitialMode] = useState('login')
  const [overlayKey, setOverlayKey] = useState(0)

  const openAuth = useCallback((opts = {}) => {
    const path = opts.nextPath != null ? String(opts.nextPath) : '/menu'
    setNextPath(path)
    setInitialMode(opts.mode === 'register' ? 'register' : 'login')
    setOverlayKey((k) => k + 1)
    setOpen(true)
  }, [])

  const closeAuth = useCallback(() => {
    setOpen(false)
    setInitialMode('login')
  }, [])

  const value = useMemo(
    () => ({ openAuth, closeAuth }),
    [openAuth, closeAuth],
  )

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      {open ? (
        <AuthOverlay key={overlayKey} nextPath={nextPath} initialMode={initialMode} onDismiss={closeAuth} />
      ) : null}
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext)
  if (!ctx) {
    throw new Error('useAuthModal must be used within AuthModalProvider')
  }
  return ctx
}
