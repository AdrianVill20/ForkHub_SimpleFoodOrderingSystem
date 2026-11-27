import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'
import DeliveryMap from '../components/DeliveryMap'
import { useAuthModal } from '../contexts/useAuthModal'
import { deleteUser } from '../services/authService'
import { DELIVERY_BRANCH } from '../constants'
import { isValidPhone, normalizePhone, PHONE_ERROR_MESSAGE } from '../utils/phone'
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
    role: 'customer',
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [addressDestination, setAddressDestination] = useState(null)
  const [phoneError, setPhoneError] = useState('')
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const [addressSearchMessage, setAddressSearchMessage] = useState('')
  const lastGeocodedAddressRef = useRef('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [scheduledDeletion, setScheduledDeletion] = useState(null)
  const [showDeletionScheduled, setShowDeletionScheduled] = useState(false)
  const navigate = useNavigate()
  const { openAuth } = useAuthModal()
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      openAuth({ nextPath: '/profile' })
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
          role: payload.user.role || 'customer',
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
  }, [apiBaseUrl, navigate, openAuth])

  useEffect(() => {
    const query = profile.address.trim()
    if (!isEditing || !query || lastGeocodedAddressRef.current === query) {
      if (!isEditing) setIsSearchingAddress(false)
      if (!query) {
        setAddressDestination(null)
        setAddressSearchMessage('')
      }
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setIsSearchingAddress(true)
      setAddressSearchMessage('Searching address…')

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        )
        if (!response.ok) throw new Error('Address search failed')

        const results = await response.json()
        if (!Array.isArray(results) || results.length === 0) {
          setAddressDestination(null)
          setAddressSearchMessage('Address not found. Try another address or pin it on the map.')
          return
        }

        const result = results[0]
        const lat = Number(result.lat)
        const lng = Number(result.lon)
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          throw new Error('The address result did not include a valid location.')
        }

        const resolvedAddress = result.display_name || query
        lastGeocodedAddressRef.current = resolvedAddress
        setAddressDestination({ lat, lng, name: resolvedAddress })
        setAddressSearchMessage('Location found and shown on the map.')
        setProfile((previous) => ({ ...previous, address: resolvedAddress }))
      } catch (error) {
        if (controller.signal.aborted) return
        setAddressDestination(null)
        setAddressSearchMessage(error.message || 'Unable to locate the address. Try another query.')
      } finally {
        if (!controller.signal.aborted) setIsSearchingAddress(false)
      }
    }, 700)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [isEditing, profile.address])

  const updateProfileField = (fieldName, value) => {
    setProfile((prev) => ({ ...prev, [fieldName]: value }))
  }

  const handleAddressInputChange = (value) => {
    lastGeocodedAddressRef.current = ''
    setIsSearchingAddress(false)
    setAddressDestination(null)
    setAddressSearchMessage('')
    updateProfileField('address', value)
  }

  const handlePinnedAddressChange = useCallback((value) => {
    lastGeocodedAddressRef.current = value.trim()
    setIsSearchingAddress(false)
    setAddressSearchMessage('Delivery location pinned.')
    setProfile((previous) => ({ ...previous, address: value }))
  }, [])

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim()

  const saveProfile = async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) { navigate('/profile'); return }
    if (!isValidPhone(profile.phone)) {
      setPhoneError(PHONE_ERROR_MESSAGE)
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
          phone: normalizePhone(profile.phone),
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
        role: payload.user.role || 'customer',
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
      const result = await deleteUser(token)
      setShowConfirmModal(false)
      setConfirmText('')
      setScheduledDeletion(result.scheduledDeletionAt)
      setShowDeletionScheduled(true)
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete account')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelDeletion = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      await fetch('/api/auth/profile/restore', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      setShowDeletionScheduled(false)
      setScheduledDeletion(null)
      // Refresh user info
      const res  = await fetch('/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      localStorage.setItem('auth_user', JSON.stringify(data.user))
      window.dispatchEvent(new Event('auth-changed'))
    } catch { /* ignore */ }
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
                <span className="profile-badge">Customer</span>
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
          <div style={{ background: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)', padding: '16px 20px', borderRadius: '8px', marginBottom: '24px', animation: 'slideInDown 0.4s ease-out', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, boxShadow: 'var(--shadow-card)' }}>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Profile Stats Grid */}
        <div className="profile-stats-grid">
          <div className="profile-stat-card">
            <div className="profile-stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary-container)" strokeWidth="2">
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary-container)" strokeWidth="2">
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary-container)" strokeWidth="2">
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
                        onChange={e => {
                          updateProfileField('phone', e.target.value)
                          setPhoneError(isValidPhone(e.target.value) ? '' : PHONE_ERROR_MESSAGE)
                        }}
                        onBlur={() => setPhoneError(isValidPhone(profile.phone) ? '' : PHONE_ERROR_MESSAGE)}
                        aria-required="true"
                        aria-invalid={phoneError ? 'true' : undefined}
                        aria-describedby={phoneError ? 'profile-phone-error' : undefined}
                        className="field"
                        placeholder="0917 123 4567"
                      />
                      {phoneError ? <p id="profile-phone-error" className="muted" role="alert" style={{ color: 'var(--color-error)' }}>{phoneError}</p> : null}
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
                      disabled={isSaving || !isValidPhone(profile.phone)}
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
                    <label style={{ fontSize: '12px', color: 'var(--color-outline)', fontWeight: '700', textTransform: 'uppercase' }}>
                      <img src={addressIcon} alt="Address" style={{ width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle' }} />
                      Delivery Address
                    </label>
                    <textarea
                      value={profile.address}
                      onChange={e => handleAddressInputChange(e.target.value)}
                      className="field"
                      placeholder="Type your delivery address"
                      rows="4"
                      style={{ resize: 'vertical', fontFamily: 'inherit', padding: '12px' }}
                    />
                    <p className="muted" role="status" style={{ margin: '4px 0 0' }}>
                      {isSearchingAddress ? 'Searching address…' : addressSearchMessage || 'Type an address to locate it, or click the map to pin it.'}
                    </p>
                    <DeliveryMap
                      branch={DELIVERY_BRANCH}
                      address={profile.address}
                      destination={addressDestination}
                      onDestinationChange={setAddressDestination}
                      onAddressChange={handlePinnedAddressChange}
                      onStatusChange={setAddressSearchMessage}
                    />
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
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
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
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary-container)" strokeWidth="2">
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
                <p className="profile-danger-warning">Delete your account without permanently removing your data</p>
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
                  navigate('/')
                }}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Deletion Scheduled Notice — shows after soft delete */}
      {showDeletionScheduled && scheduledDeletion && (
        <div className="profile-modal-overlay" style={{ zIndex: 1000 }}>
          <div className="profile-modal-content-new" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header-new">
              <div className="profile-modal-icon" style={{ fontSize: 32 }}>⏳</div>
              <h2>Account Deleted</h2>
              <p>Your account has been marked as deleted</p>
            </div>
            <div className="profile-modal-body-new">
              <p style={{ textAlign: 'center', marginBottom: 12, color: 'var(--color-on-surface-variant)' }}>
                You can restore your account until:
              </p>
              <p style={{
                textAlign: 'center', fontWeight: 700, fontSize: 18,
                color: 'var(--color-primary-container)', background: 'var(--color-error-container)',
                padding: '10px 16px', borderRadius: 8, marginBottom: 16,
              }}>
                {new Date(scheduledDeletion).toLocaleDateString('en-PH', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
              <p style={{ textAlign: 'center', color: 'var(--color-on-surface-variant)', fontSize: 13 }}>
                You can cancel this deletion anytime before that date by logging back in and clicking <strong>Cancel Deletion</strong> on your profile.
              </p>
            </div>
            <div className="profile-modal-footer-new">
              <button
                onClick={handleCancelDeletion}
                className="profile-modal-btn-cancel-new"
                style={{ background: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)', border: 'none' }}
              >
                Cancel Deletion
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('auth_token')
                  localStorage.removeItem('auth_user')
                  localStorage.removeItem('login')
                  window.dispatchEvent(new Event('auth-changed'))
                  navigate('/')
                }}
                className="profile-modal-btn-delete-new enabled"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Deletion Banner */}
      {!showDeletionScheduled && (() => {
        try {
          const u = JSON.parse(localStorage.getItem('auth_user') || '{}')
          if (!u.isDeleted || !u.scheduledDeletionAt) return null
          return (
            <div style={{
              position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              background: 'var(--color-primary-container)', color: 'var(--color-surface-container-lowest)', borderRadius: 12,
              padding: '14px 24px', zIndex: 999, maxWidth: 480, width: '90%',
              display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 4px 20px color-mix(in srgb, var(--color-inverse-surface) 25%, transparent)',
            }}>
              <div style={{ flex: 1 }}>
                <strong>Account marked as deleted</strong>
                <p style={{ margin: '4px 0 0', fontSize: 13 }}>
                  Recovery available until {new Date(u.scheduledDeletionAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={handleCancelDeletion}
                style={{
                  background: 'var(--color-surface-container-lowest)', color: 'var(--color-primary-container)', border: 'none',
                  borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          )
        } catch { return null }
      })()}
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
              <p>You can restore your account within 5 days</p>
            </div>
            
            <div className="profile-modal-body-new">
              <p className="profile-modal-warning-text">
                Deleting your account will:
              </p>
              <ul className="profile-modal-list">
                <li>Remove all your personal data</li>
                <li>Cancel any active orders</li>
                <li>Retain your order history</li>
                <li>Mark your account as deleted</li>
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
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
