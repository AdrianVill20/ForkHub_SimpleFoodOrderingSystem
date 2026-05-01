import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'
import { deleteUser } from '../services/authService'

export default function UserPage() {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      await deleteUser(token)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      navigate('/')
    } catch (err) {
      setError(err.message || 'Failed to delete account')
      setIsDeleting(false)
    }
  }

  return (
    <div className="page">
      <TopNav signedIn />
      <main className="content-wrap">
        <h1 className="section-title">Profile Settings</h1>
        <p className="muted" style={{ textAlign: 'center' }}>
          Easily manage your profile settings right from this page
        </p>

        {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: 20 }}>{error}</p>}

        <section className="form-panel" style={{ maxWidth: 900 }}>
          <h2 className="card-title">Personal Information</h2>
          <div style={{ padding: 14 }}>
            <p className="muted">First Name: John Christian</p>
            <p className="muted">Last Name: Entoma</p>
            <p className="muted">Email: john@email.com</p>
            <p className="muted">Phone: 09227235525</p>
          </div>
        </section>

        <section className="form-panel" style={{ maxWidth: 900 }}>
          <h2 className="card-title">Address Information</h2>
          <div style={{ padding: 14 }}>
            <p className="muted">Quezon Boulevard, 1001, Quiapo, Manila</p>
            <p style={{ color: '#98008f', fontWeight: 700, marginTop: 14 }}>+ Add Address</p>
          </div>
        </section>

        <section className="form-panel" style={{ maxWidth: 900 }}>
          <h2 className="card-title" style={{ color: '#d32f2f' }}>Danger Zone</h2>
          <div style={{ padding: 14 }}>
            <p className="muted">Permanently delete your account and all associated data.</p>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              style={{
                marginTop: 14,
                padding: '10px 16px',
                backgroundColor: '#d32f2f',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                opacity: isDeleting ? 0.6 : 1,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}