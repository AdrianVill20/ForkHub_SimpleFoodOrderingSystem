import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'
import { deleteUser } from '../services/authService'

export default function UserPage() {
  const navigate = useNavigate()
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
  const storedUser = JSON.parse(localStorage.getItem('auth_user') || '{}')

  const [profile] = useState({
    firstName: storedUser.firstName || '',
    lastName: storedUser.lastName || '',
    email: storedUser.email || '',
    phone: storedUser.phone || '',
    address: storedUser.address || '',
  })
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Not set'

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    setError('')
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) throw new Error('No authentication token found')
      await deleteUser(token)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      localStorage.removeItem('login')
      window.dispatchEvent(new Event('auth-changed'))
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
            <p className="muted"><strong>Name:</strong> {fullName}</p>
            <p className="muted"><strong>Email:</strong> {profile.email || 'Not set'}</p>
            <p className="muted"><strong>Phone:</strong> {profile.phone || 'Not set'}</p>
          </div>
          <div style={{ padding: '0 14px 14px' }}>
            <button className="btn-red" onClick={() => navigate('/dashboard')}>
              Edit Profile
            </button>
          </div>
        </section>

        <section className="form-panel" style={{ maxWidth: 900 }}>
          <h2 className="card-title">Address Information</h2>
          <div style={{ padding: 14 }}>
            <p className="muted">{profile.address || 'Not set'}</p>
          </div>
        </section>

        <section className="form-panel" style={{ maxWidth: 900 }}>
          <h2 className="card-title" style={{ color: '#d32f2f' }}>Danger Zone</h2>
          <div style={{ padding: '14px 14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, borderTop: '1px solid #fca5a5', paddingTop: 16 }}>
              <div>
                <p style={{ fontWeight: 600, margin: '0 0 4px' }}>Delete Account</p>
                <p className="muted">Permanently delete your account and all associated data.</p>
              </div>
              <button
                onClick={() => { setConfirmText(''); setError(''); setShowConfirmModal(true) }}
                disabled={isDeleting}
                style={{ padding: '10px 16px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </section>
      </main>

      {showConfirmModal && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={() => { if (!isDeleting) { setShowConfirmModal(false); setConfirmText('') } }}
        >
          <div
            style={{ backgroundColor: 'white', padding: '32px 28px', borderRadius: 12, width: '100%', maxWidth: 420 }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 8px' }}>Confirm Account Deletion</h2>
            <p style={{ margin: '0 0 20px', color: '#555' }}>This action cannot be undone.</p>
            <label style={{ fontWeight: 600, fontSize: 14 }}>
              Type{' '}
              <span style={{ fontFamily: 'monospace', background: '#f0f0f0', padding: '1px 5px', borderRadius: 3 }}>DELETE</span>
              {' '}to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="Type DELETE here"
              autoFocus
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: 6, fontSize: 14, marginTop: 6, marginBottom: 4, boxSizing: 'border-box' }}
            />
            {error && <p style={{ color: 'red', fontSize: 13, margin: '4px 0' }}>{error}</p>}
            <div style={{ display: 'flex', marginTop: 16, gap: 10 }}>
              <button
                onClick={() => { setShowConfirmModal(false); setConfirmText('') }}
                disabled={isDeleting}
                style={{ flex: 1, padding: '10px 0', border: '1px solid #ccc', borderRadius: 6, background: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || confirmText !== 'DELETE'}
                style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: 6, background: confirmText === 'DELETE' ? '#d32f2f' : '#cf8181', color: 'white', fontWeight: 700, cursor: confirmText === 'DELETE' && !isDeleting ? 'pointer' : 'not-allowed' }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}