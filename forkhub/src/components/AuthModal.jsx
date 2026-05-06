import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuthModal } from '../context/AuthModalContext'
import LoginForm from './LoginForm'
import RegisterForm from '../pages/Register'

export default function AuthModal() {
  const { isOpen, view, setView, nextPath, closeAuthModal } = useAuthModal()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isOpen) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') closeAuthModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, closeAuthModal])

  if (!isOpen) return null

  const finishSuccess = (path) => {
    closeAuthModal()
    navigate(path)
  }

  const node = (
    <div
      className="auth-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeAuthModal()
      }}
    >
      <div className={view === 'register' ? 'auth-modal-dialog auth-modal-dialog--register' : 'auth-modal-dialog'}>
        {view === 'login' ? (
          <LoginForm
            nextPath={nextPath}
            onSuccess={finishSuccess}
            onRequestRegister={() => setView('register')}
            onClose={closeAuthModal}
          />
        ) : (
          <RegisterForm
            nextPath={nextPath}
            onSuccess={finishSuccess}
            onRequestLogin={() => setView('login')}
            onClose={closeAuthModal}
          />
        )}
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
