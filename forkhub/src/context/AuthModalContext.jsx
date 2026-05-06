import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const AuthModalContext = createContext(null)

export function AuthModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState('login')
  const [nextPath, setNextPath] = useState('/menu')

  const openAuthModal = useCallback((opts = {}) => {
    setView(opts.view === 'register' ? 'register' : 'login')
    setNextPath(typeof opts.nextPath === 'string' ? opts.nextPath : '/menu')
    setIsOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsOpen(false)
  }, [])

  const value = useMemo(
    () => ({
      isOpen,
      view,
      setView,
      nextPath,
      openAuthModal,
      closeAuthModal,
    }),
    [isOpen, view, nextPath, openAuthModal, closeAuthModal],
  )

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext)
  if (!ctx) {
    throw new Error('useAuthModal must be used within AuthModalProvider')
  }
  return ctx
}
