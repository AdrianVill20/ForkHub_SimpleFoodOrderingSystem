import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'
import { deleteUser } from '../services/authService'

export default function DashboardPage() {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
  })
  const [originalProfile, setOriginalProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const navigate = useNavigate()
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      navigate('/login')
      return
    }

    const loadProfile = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const payload = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(payload.message || 'Failed to load profile')
        }

        const data = {
          firstName: payload.user.firstName || '',
          lastName: payload.user.lastName || '',
          email: payload.user.email || '',
          phone: payload.user.phone || '',
          address: payload.user.address || '',
        }
        setProfile(data)
        setOriginalProfile(data)
        localStorage.setItem('auth_user', JSON.stringify(payload.user))
        window.dispatchEvent(new Event('auth-changed'))
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [apiBaseUrl, navigate])

  const updateProfileField = (fieldName, value) => {
    setProfile((prev) => ({ ...prev, [fieldName]: value }))
  }

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim()

  const logout = () => {
    localStorage.removeItem('login')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    window.dispatchEvent(new Event('auth-changed'))
    navigate('/login')
  }

  const saveProfile = async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) { navigate('/login'); return }

    setErrorMessage('')
    setSuccessMessage('')
    setIsSaving(true)

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          address: profile.address,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.message || 'Failed to update profile')

      const updated = {
        firstName: payload.user.firstName || '',
        lastName: payload.user.lastName || '',
        email: payload.user.email || '',
        phone: payload.user.phone || '',
        address: payload.user.address || '',
      }
      setProfile(updated)
      setOriginalProfile(updated)
      localStorage.setItem('auth_user', JSON.stringify(payload.user))
      window.dispatchEvent(new Event('auth-changed'))
      setSuccessMessage('Profile updated successfully.')
      setIsEditing(false)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    setErrorMessage('')
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) throw new Error('No authentication token found')
      await deleteUser(token)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      localStorage.removeItem('login')
      navigate('/')
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete account')
      setIsDeleting(false)
    }
  }

  return (
    <div className="page">
      <TopNav signedIn />
      <main className="content-wrap">
        <h1 className="section-title">Your ForkHub&apos;s Profile</h1>
        <p className="muted" style={{ textAlign: 'center', marginBottom: 20 }}>
          Manage and edit your profile settings
        </p>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <button className="btn-red" onClick={logout}>
            Logout
          </button>
        </div>

        {errorMessage && (
          <p style={{ color: '#c62828', textAlign: 'center', marginBottom: 16 }}>{errorMessage}</p>
        )}
        {successMessage && (
          <p style={{ color: '#2e7d32', textAlign: 'center', marginBottom: 16 }}>{successMessage}</p>
        )}


        <section className="form-panel" style={{ maxWidth: 900 }}>
          <h2 className="card-title">Profile Settings</h2>
          <div style={{ padding: 16 }}>
            <p className="muted">Review your information below. Click Edit Profile to update your details.</p>
            {isLoading ? <p className="muted">Loading profile...</p> : null}
            <div className="light-box" style={{ marginTop: 12, padding: 12 }}>
              <p className="muted" style={{ margin: 0 }}><strong>Name:</strong> {fullName || 'Not set'}</p>
              <p className="muted" style={{ margin: '6px 0 0' }}><strong>Email:</strong> {profile.email || 'Not set'}</p>
              <p className="muted" style={{ margin: '6px 0 0' }}><strong>Phone:</strong> {profile.phone || 'Not set'}</p>
              <p className="muted" style={{ margin: '6px 0 0' }}><strong>Address:</strong> {profile.address || 'Not set'}</p>
            </div>
            <div style={{ marginTop: 12 }}>
              <button className="btn-red" onClick={() => { setErrorMessage(''); setSuccessMessage(''); setIsEditing(true) }} disabled={isLoading}>
                Edit Profile
              </button>
            </div>
          </div>
        </section>

 
        <section className="form-panel" style={{ maxWidth: 900 }}>
          <h2 className="card-title">E-Coupons</h2>
          <div style={{ padding: 16, display: 'flex', gap: 14 }}>
            <div className="light-box" style={{ borderRadius: 20, padding: 16, width: 170 }}>
              <p style={{ margin: 0, color: '#98008f', fontWeight: 700 }}>Free delivery with minimum purchase</p>
              <button className="btn-red" style={{ marginTop: 10, padding: '6px 12px' }}>
                Add Coupon
              </button>
            </div>
          </div>
        </section>

 
        <section className="form-panel" style={{ maxWidth: 900 }}>
          <h2 className="card-title" style={{ color: '#d32f2f' }}>Danger Zone</h2>
          <div style={{ padding: '14px 14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, borderTop: '1px solid #fca5a5', paddingTop: 16 }}>
              <div>
                <p style={{ fontWeight: 600, margin: '0 0 4px', color: '#111111' }}>Delete Account</p>
                <p className="muted">Permanently delete your account and all associated data.</p>
              </div>
              <button
                onClick={() => { setConfirmText(''); setErrorMessage(''); setShowConfirmModal(true) }}
                disabled={isDeleting}
                style={{
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
          </div>
        </section>
      </main>

 
      {isEditing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div className="light-box" style={{ width: 'min(620px, 100%)', padding: 16 }}>
            <h3 style={{ margin: '0 0 8px' }}>Edit Your Information</h3>
            <label>First Name</label>
            <input className="field" value={profile.firstName} onChange={(e) => updateProfileField('firstName', e.target.value)} />
            <label>Last Name</label>
            <input className="field" value={profile.lastName} onChange={(e) => updateProfileField('lastName', e.target.value)} />
            <label>Email</label>
            <input className="field field-readonly" value={profile.email} disabled />
            <label>Phone</label>
            <input className="field" value={profile.phone} onChange={(e) => updateProfileField('phone', e.target.value)} />
            <label>Primary Address</label>
            <input className="field" value={profile.address} onChange={(e) => updateProfileField('address', e.target.value)} />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn-red" onClick={saveProfile} disabled={isSaving || isLoading}>
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
              <button className="btn-purple" onClick={() => { setProfile(originalProfile); setIsEditing(false) }} disabled={isSaving}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={() => { if (!isDeleting) { setShowConfirmModal(false); setConfirmText('') } }}
        >
          <div
            style={{ backgroundColor: 'white', padding: '32px 28px', borderRadius: 12, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.55)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 24 }}>
              🗑️
            </div>
            <h2 style={{ margin: '0 0 8px' }}>Confirm Account Deletion</h2>
            <p style={{ margin: '0 0 20px', color: '#555' }}>
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            <label style={{ fontWeight: 600, fontSize: 14, color: '#333', display: 'block', marginBottom: 6 }}>
              Type <span style={{ fontFamily: 'monospace', background: '#f0f0f0', padding: '1px 5px', borderRadius: 3 }}>DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              disabled={isDeleting}
              placeholder="Type DELETE here"
              autoFocus
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: 6, fontSize: 14, marginBottom: 8, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace', letterSpacing: 1 }}
            />
            {errorMessage && (
              <p style={{ color: 'red', margin: '0 0 12px', fontSize: 13 }}>{errorMessage}</p>
            )}
            <div style={{ display: 'flex', marginTop: 16, gap: 10 }}>
              <button
                onClick={() => { setShowConfirmModal(false); setConfirmText('') }}
                disabled={isDeleting}
                style={{ flex: 1, padding: '10px 0', border: '1px solid #ccc', borderRadius: 6, background: '#fff', fontWeight: 600, fontSize: 14, cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.5 : 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || confirmText !== 'DELETE'}
                style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: 6, background: confirmText === 'DELETE' ? '#d32f2f' : '#cf8181', color: 'white', fontWeight: 700, fontSize: 14, cursor: confirmText === 'DELETE' && !isDeleting ? 'pointer' : 'not-allowed' }}
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
