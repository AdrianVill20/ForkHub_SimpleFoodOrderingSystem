import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'
import { deleteUser } from '../services/authService'
import profileIcon from '../assets/profile-icon.svg'
import emailIcon from '../assets/email-icon.svg'
import phoneIcon from '../assets/phone-icon.svg'
import addressIcon from '../assets/address-icon.svg'
import dangerIcon from '../assets/danger-icon.svg'
import editIcon from '../assets/edit-icon.svg'

export default function DashboardPage() {
  const [profile, setProfile] = useState({
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
  const [isDeleting, setIsDeleting] = useState(false)
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
      window.dispatchEvent(new Event('auth-changed'))
      navigate('/')
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete account')
      setIsDeleting(false)
    }
  }

  return (
    <div className="page profile-page">
      <TopNav signedIn />
      <main className="content-wrap profile-content-wrap">
        {/* Hero Header with Animated Background */}
        <section className="profile-hero">
          <div className="profile-hero-background">
            <div className="profile-hero-blob blob-1"></div>
            <div className="profile-hero-blob blob-2"></div>
            <div className="profile-hero-blob blob-3"></div>
          </div>
          
          <div className="profile-hero-content">
            <div className="profile-hero-avatar-section">
              <div className="profile-avatar-wrapper">
                <div className="profile-avatar-circle">
                  <img src={profileIcon} alt="Profile" className="avatar-icon" />
                </div>
                <div className="profile-avatar-status">Online</div>
              </div>
            </div>
            
            <div className="profile-hero-info">
              <h1 className="profile-hero-title">{fullName}</h1>
              <p className="profile-hero-email">{profile.email}</p>
              <div className="profile-hero-badges">
                <span className="profile-badge">Member</span>
                <span className="profile-badge">Active</span>
              </div>
            </div>
          </div>
        </section>

        {/* Error Message */}
        {errorMessage && (
          <div className="profile-error-banner">
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div style={{ background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)', color: '#fff', padding: '16px 20px', borderRadius: '8px', marginBottom: '24px', animation: 'slideInDown 0.4s ease-out', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, boxShadow: '0 4px 12px rgba(46, 204, 113, 0.2)' }}>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Profile Stats Grid */}
        <div className="profile-stats-grid">
          <div className="profile-stat-card">
            <div className="profile-stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7ad8dc" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 6h20" />
              </svg>
            </div>
            <div className="profile-stat-content">
              <p className="profile-stat-label">Email</p>
              <p className="profile-stat-value">{profile.email ? 'Verified' : 'Pending'}</p>
            </div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7ad8dc" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div className="profile-stat-content">
              <p className="profile-stat-label">Phone</p>
              <p className="profile-stat-value">{profile.phone ? 'Added' : 'Missing'}</p>
            </div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7ad8dc" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="profile-stat-content">
              <p className="profile-stat-label">Address</p>
              <p className="profile-stat-value">{profile.address ? 'Saved' : 'Not Set'}</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="profile-main-grid">
          {/* Left Column - Primary Info */}
          <div className="profile-left-column">
            {/* Personal Information Card */}
            <div className="profile-card profile-card-primary">
              <div className="profile-card-header-new">
                <div className="profile-card-header-icon">
                  <img src={emailIcon} alt="Personal" className="profile-card-icon-img" />
                </div>
                <div className="profile-card-header-text">
                  <h2 className="profile-card-title-new">Personal Information</h2>
                  <p className="profile-card-subtitle-new">Your account details</p>
                </div>
              </div>
              
              <div className="profile-card-content-new">
                {isEditing ? (
                  <div className="profile-info-grid">
                    <div className="profile-info-field">
                      <span className="profile-field-label">
                        <img src={profileIcon} alt="Name" className="profile-field-icon" />
                        First Name
                      </span>
                      <input
                        type="text"
                        value={profile.firstName}
                        onChange={e => updateProfileField('firstName', e.target.value)}
                        className="field"
                        placeholder="First Name"
                      />
                    </div>
                    <div className="profile-info-field">
                      <span className="profile-field-label">
                        <img src={profileIcon} alt="Name" className="profile-field-icon" />
                        Last Name
                      </span>
                      <input
                        type="text"
                        value={profile.lastName}
                        onChange={e => updateProfileField('lastName', e.target.value)}
                        className="field"
                        placeholder="Last Name"
                      />
                    </div>
                    <div className="profile-info-field">
                      <span className="profile-field-label">
                        <img src={emailIcon} alt="Email" className="profile-field-icon" />
                        Email Address
                      </span>
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="field field-readonly"
                        placeholder="Email"
                      />
                    </div>
                    <div className="profile-info-field">
                      <span className="profile-field-label">
                        <img src={phoneIcon} alt="Phone" className="profile-field-icon" />
                        Phone Number
                      </span>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={e => updateProfileField('phone', e.target.value)}
                        className="field"
                        placeholder="Phone Number"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="profile-info-grid">
                    <div className="profile-info-field">
                      <span className="profile-field-label">
                        <img src={profileIcon} alt="Name" className="profile-field-icon" />
                        Full Name
                      </span>
                      <p className="profile-field-value">{fullName}</p>
                    </div>
                    <div className="profile-info-field">
                      <span className="profile-field-label">
                        <img src={emailIcon} alt="Email" className="profile-field-icon" />
                        Email Address
                      </span>
                      <p className="profile-field-value">{profile.email || 'Not set'}</p>
                    </div>
                    <div className="profile-info-field">
                      <span className="profile-field-label">
                        <img src={phoneIcon} alt="Phone" className="profile-field-icon" />
                        Phone Number
                      </span>
                      <p className="profile-field-value">{profile.phone || 'Not set'}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="profile-card-footer">
                {isEditing ? (
                  <>
                    <button
                      className="profile-btn-primary"
                      onClick={() => { setErrorMessage(''); setSuccessMessage(''); setIsEditing(false) }}
                      disabled={isSaving}
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </button>
                    <button
                      className="profile-btn-primary"
                      onClick={saveProfile}
                      disabled={isSaving}
                      style={{ flex: 1 }}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <button 
                    className="profile-btn-primary"
                    onClick={() => { setErrorMessage(''); setSuccessMessage(''); setIsEditing(true) }}
                    disabled={isLoading}
                  >
                    <img src={editIcon} alt="Edit" className="profile-btn-icon" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Address Card */}
            <div className="profile-card profile-card-accent">
              <div className="profile-card-header-new">
                <div className="profile-card-header-icon accent">
                  <img src={addressIcon} alt="Address" className="profile-card-icon-img" />
                </div>
                <div className="profile-card-header-text">
                  <h2 className="profile-card-title-new">Delivery Address</h2>
                  <p className="profile-card-subtitle-new">Your saved location</p>
                </div>
              </div>
              
              <div className="profile-card-content-new">
                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '12px', color: '#999', fontWeight: '700', textTransform: 'uppercase' }}>
                      <img src={addressIcon} alt="Address" style={{ width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle' }} />
                      Delivery Address
                    </label>
                    <textarea
                      value={profile.address}
                      onChange={e => updateProfileField('address', e.target.value)}
                      className="field"
                      placeholder="Enter your complete delivery address"
                      rows="4"
                      style={{ resize: 'vertical', fontFamily: 'inherit', padding: '12px' }}
                    />
                    <p style={{ fontSize: '12px', color: '#999', margin: '4px 0 0' }}>Include street, city, and postal code</p>
                  </div>
                ) : (
                  <div className="profile-address-display">
                    {profile.address ? (
                      <>
                        <p className="profile-address-text">{profile.address}</p>
                      </>
                    ) : (
                      <p className="profile-address-empty">No address saved yet. Click "Edit Profile" to add one.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Account Settings */}
          <div className="profile-right-column">
            {/* Account Security Card */}
            <div className="profile-card profile-card-secondary">
              <div className="profile-card-header-new">
                <div className="profile-card-header-icon secondary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#98008f" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className="profile-card-header-text">
                  <h2 className="profile-card-title-new">Account Security</h2>
                  <p className="profile-card-subtitle-new">Keep your account safe</p>
                </div>
              </div>
              
              <div className="profile-card-content-new">
                <div className="profile-security-item">
                  <div className="profile-security-check"></div>
                  <span className="profile-security-text">Password protected</span>
                </div>
                <div className="profile-security-item">
                  <div className="profile-security-check"></div>
                  <span className="profile-security-text">Email verified</span>
                </div>
                <div className="profile-security-item">
                  <div className="profile-security-check"></div>
                  <span className="profile-security-text">Active session</span>
                </div>
              </div>
            </div>

            {/* Quick Stats Card */}
            <div className="profile-card profile-card-stats">
              <div className="profile-card-header-new">
                <div className="profile-card-header-icon stats">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef8f2f" strokeWidth="2">
                    <line x1="12" y1="2" x2="12" y2="22" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className="profile-card-header-text">
                  <h2 className="profile-card-title-new">Account Status</h2>
                  <p className="profile-card-subtitle-new">Profile completion</p>
                </div>
              </div>
              
              <div className="profile-card-content-new">
                <div className="profile-completion-bar">
                  <div className="profile-completion-fill" style={{ width: `${([profile.firstName, profile.lastName, profile.email, profile.phone, profile.address].filter(Boolean).length / 5) * 100}%` }}></div>
                </div>
                <p className="profile-completion-text">{Math.round(([profile.firstName, profile.lastName, profile.email, profile.phone, profile.address].filter(Boolean).length / 5) * 100)}% complete</p>
              </div>
            </div>

            {/* Danger Zone Card */}
            <div className="profile-card profile-card-danger">
              <div className="profile-card-header-new">
                <div className="profile-card-header-icon danger">
                  <img src={dangerIcon} alt="Danger" className="profile-card-icon-img" />
                </div>
                <div className="profile-card-header-text">
                  <h2 className="profile-card-title-new danger-zone-title">Danger Zone</h2>
                  <p className="profile-card-subtitle-new">Irreversible actions</p>
                </div>
              </div>
              
              <div className="profile-card-content-new">
                <p className="profile-danger-warning">Permanently delete your account and all data</p>
              </div>

              <div className="profile-card-footer danger">
                <button
                  onClick={() => { setErrorMessage(''); setShowConfirmModal(true) }}
                  disabled={isDeleting}
                  className="profile-btn-danger"
                >
                  Delete Account
                </button>
              </div>
            </div>

            {/* Logout Card */}
            <div className="profile-card profile-card-logout">
              <div className="profile-card-content-new" style={{ padding: 16, textAlign: 'center' }}>
                <button className="profile-btn-logout" onClick={() => {
                  localStorage.removeItem('login')
                  localStorage.removeItem('auth_token')
                  localStorage.removeItem('auth_user')
                  window.dispatchEvent(new Event('auth-changed'))
                  navigate('/login')
                }}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showConfirmModal && (
        <div
          className="profile-modal-overlay"
          onClick={() => { if (!isDeleting) { setShowConfirmModal(false); setConfirmText('') } }}
        >
          <div className="profile-modal-content-new" onClick={e => e.stopPropagation()}>
            <div className="profile-modal-header-new">
              <div className="profile-modal-icon">
                <img src={dangerIcon} alt="Warning" />
              </div>
              <h2>Delete Your Account?</h2>
              <p>This action is permanent and cannot be undone</p>
            </div>
            
            <div className="profile-modal-body-new">
              <p className="profile-modal-warning-text">
                Deleting your account will:
              </p>
              <ul className="profile-modal-list">
                <li>Remove all your personal data</li>
                <li>Cancel any active orders</li>
                <li>Delete your order history</li>
                <li>Close your account permanently</li>
              </ul>

              <label className="profile-modal-label-new">
                Type <span className="profile-modal-code-new">DELETE</span> to confirm deletion
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="Type DELETE here"
                autoFocus
                className="profile-modal-input-new"
              />
            </div>
            
            <div className="profile-modal-footer-new">
              <button
                onClick={() => { setShowConfirmModal(false); setConfirmText('') }}
                disabled={isDeleting}
                className="profile-modal-btn-cancel-new"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || confirmText !== 'DELETE'}
                className={`profile-modal-btn-delete-new ${confirmText === 'DELETE' ? 'enabled' : 'disabled'}`}
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
