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

        setProfile({
          firstName: payload.user.firstName || '',
          lastName: payload.user.lastName || '',
          email: payload.user.email || '',
          phone: payload.user.phone || '',
          address: payload.user.address || '',
        })
        setOriginalProfile({
          firstName: payload.user.firstName || '',
          lastName: payload.user.lastName || '',
          email: payload.user.email || '',
          phone: payload.user.phone || '',
          address: payload.user.address || '',
        })
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
    if (!token) {
      navigate('/login')
      return
    }

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

      if (!response.ok) {
        throw new Error(payload.message || 'Failed to update profile')
      }

      setProfile((prev) => ({
        ...prev,
        firstName: payload.user.firstName || '',
        lastName: payload.user.lastName || '',
        phone: payload.user.phone || '',
        address: payload.user.address || '',
      }))
      setOriginalProfile({
        firstName: payload.user.firstName || '',
        lastName: payload.user.lastName || '',
        email: payload.user.email || '',
        phone: payload.user.phone || '',
        address: payload.user.address || '',
      })
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

  const startEditing = () => {
    setErrorMessage('')
    setSuccessMessage('')
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setProfile(originalProfile)
    setErrorMessage('')
    setSuccessMessage('')
    setIsEditing(false)
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

        <section className="form-panel" style={{ maxWidth: 900 }}>
          <h2 className="card-title">Profile Settings</h2>
          <div style={{ padding: 16 }}>
            <p className="muted">Review your information below. Click Edit Profile to update your details.</p>
            {isLoading ? <p className="muted">Loading profile...</p> : null}
            {errorMessage ? (
              <p className="muted" style={{ color: '#c62828', marginTop: 8 }}>
                {errorMessage}
              </p>
            ) : null}
            {successMessage ? (
              <p className="muted" style={{ color: '#2e7d32', marginTop: 8 }}>
                {successMessage}
              </p>
            ) : null}
            <div className="light-box" style={{ marginTop: 12, padding: 12 }}>
              <p className="muted" style={{ margin: 0 }}>
                <strong>Name:</strong> {fullName || 'Not set'}
              </p>
              <p className="muted" style={{ margin: '6px 0 0' }}>
                <strong>Email:</strong> {profile.email || 'Not set'}
              </p>
              <p className="muted" style={{ margin: '6px 0 0' }}>
                <strong>Phone:</strong> {profile.phone || 'Not set'}
              </p>
              <p className="muted" style={{ margin: '6px 0 0' }}>
                <strong>Address:</strong> {profile.address || 'Not set'}
              </p>
            </div>

            <div style={{ marginTop: 12 }}>
              <button className="btn-red" onClick={startEditing} disabled={isLoading}>
                Edit Profile
              </button>
            </div>

            {isEditing ? (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                  padding: 16,
                }}
              >
                <div className="light-box" style={{ width: 'min(620px, 100%)', padding: 16 }}>
                  <h3 style={{ margin: '0 0 8px' }}>Edit Your Information</h3>
                  <label>First Name</label>
                  <input
                    className="field"
                    value={profile.firstName}
                    placeholder={originalProfile.firstName || 'No first name set'}
                    onChange={(event) => updateProfileField('firstName', event.target.value)}
                  />
                  <label>Last Name</label>
                  <input
                    className="field"
                    value={profile.lastName}
                    placeholder={originalProfile.lastName || 'No last name set'}
                    onChange={(event) => updateProfileField('lastName', event.target.value)}
                  />
                  <label>Email</label>
                  <input className="field field-readonly" value={profile.email} disabled />
                  <label>Phone</label>
                  <input
                    className="field"
                    value={profile.phone}
                    placeholder={originalProfile.phone || 'No phone number set'}
                    onChange={(event) => updateProfileField('phone', event.target.value)}
                  />
                  <label>Primary Address</label>
                  <input
                    className="field"
                    value={profile.address}
                    placeholder={originalProfile.address || 'No address set'}
                    onChange={(event) => updateProfileField('address', event.target.value)}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button className="btn-red" onClick={saveProfile} disabled={isSaving || isLoading}>
                      {isSaving ? 'Saving...' : 'Save Profile'}
                    </button>
                    <button className="btn-purple" onClick={cancelEditing} disabled={isSaving}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
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
      </main>
    </div>
  )
}