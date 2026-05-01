import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'

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
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
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
                <p style={{ fontWeight: 600, margin: '0 0 4px' }}>Delete Account</p>
                 <p className="muted">Permanently delete your account and all associated data.</p>
              </div>
              <button
                 onClick={() => navigate('/profile')}
                style={{ padding: '10px 16px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
                >
                  Delete Account
               </button>
            </div>
          </div>
        </section>

        </main>
      </div>    
  )
}
