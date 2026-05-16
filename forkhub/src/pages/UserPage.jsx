import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'
import { deleteUser } from '../services/authService'
import profileIcon from '../assets/profile-icon.svg'
import emailIcon from '../assets/email-icon.svg'
import phoneIcon from '../assets/phone-icon.svg'
import addressIcon from '../assets/address-icon.svg'
import dangerIcon from '../assets/danger-icon.svg'
import editIcon from '../assets/edit-icon.svg'

export default function UserPage() {
  const navigate = useNavigate()
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
    <div className="page profile-page">
      <TopNav />
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
                <span className="profile-badge">Costumer</span>
                <span className="profile-badge">Active</span>
              </div>
            </div>
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div className="profile-error-banner">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Profile Stats Grid */}
        <div className="profile-stats-grid">
          <div className="profile-stat-card">
            <div className="profile-stat-icon">📧</div>
            <div className="profile-stat-content">
              <p className="profile-stat-label">Email Verified</p>
              <p className="profile-stat-value">{profile.email ? '✓ Yes' : '✗ No'}</p>
            </div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-icon">📞</div>
            <div className="profile-stat-content">
              <p className="profile-stat-label">Phone Saved</p>
              <p className="profile-stat-value">{profile.phone ? '✓ Yes' : '✗ No'}</p>
            </div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-icon">📍</div>
            <div className="profile-stat-content">
              <p className="profile-stat-label">Address Saved</p>
              <p className="profile-stat-value">{profile.address ? '✓ Yes' : '✗ No'}</p>
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
              </div>

              <div className="profile-card-footer">
                <button 
                  className="profile-btn-primary"
                  onClick={() => navigate('/dashboard')}
                >
                  <img src={editIcon} alt="Edit" className="profile-btn-icon" />
                  Edit Profile
                </button>
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
                <div className="profile-address-display">
                  {profile.address ? (
                    <p className="profile-address-text">{profile.address}</p>
                  ) : (
                    <p className="profile-address-empty">No address saved yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Account Settings */}
          <div className="profile-right-column">
            {/* Account Security Card */}
            <div className="profile-card profile-card-secondary">
              <div className="profile-card-header-new">
                <div className="profile-card-header-icon secondary">
                  <span className="profile-security-icon">🔒</span>
                </div>
                <div className="profile-card-header-text">
                  <h2 className="profile-card-title-new">Account Security</h2>
                  <p className="profile-card-subtitle-new">Keep your account safe</p>
                </div>
              </div>
              
              <div className="profile-card-content-new">
                <div className="profile-security-item">
                  <div className="profile-security-check">✓</div>
                  <span className="profile-security-text">Password protected</span>
                </div>
                <div className="profile-security-item">
                  <div className="profile-security-check">✓</div>
                  <span className="profile-security-text">Email verified</span>
                </div>
                <div className="profile-security-item">
                  <div className="profile-security-check">✓</div>
                  <span className="profile-security-text">Active session</span>
                </div>
              </div>
            </div>

            {/* Quick Stats Card */}
            <div className="profile-card profile-card-stats">
              <div className="profile-card-header-new">
                <div className="profile-card-header-icon stats">
                  <span className="profile-stats-icon">📊</span>
                </div>
                <div className="profile-card-header-text">
                  <h2 className="profile-card-title-new">Account Status</h2>
                  <p className="profile-card-subtitle-new">Profile completion</p>
                </div>
              </div>
              
              <div className="profile-card-content-new">
                <div className="profile-completion-bar">
                  <div className="profile-completion-fill" style={{ width: '75%' }}></div>
                </div>
                <p className="profile-completion-text">75% complete</p>
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
                <p className="profile-danger-warning">⚠️ Permanently delete your account and all data</p>
              </div>

              <div className="profile-card-footer danger">
                <button
                  onClick={() => { setConfirmText(''); setError(''); setShowConfirmModal(true) }}
                  disabled={isDeleting}
                  className="profile-btn-danger"
                >
                  Delete Account
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
              {error && <p className="profile-modal-error-new">{error}</p>}
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