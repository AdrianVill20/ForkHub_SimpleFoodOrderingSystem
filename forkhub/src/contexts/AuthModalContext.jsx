import { useCallback, useMemo, useState } from 'react'
import AuthOverlay from '../components/AuthOverlay'
import { AuthModalContext } from './useAuthModal'

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
