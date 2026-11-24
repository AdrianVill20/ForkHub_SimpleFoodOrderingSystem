import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import InputField from '../components/InputField';
import Button from '../components/Button';
import './styles/EditProfile.css';

export default function EditProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setFormData(prev => ({
          ...prev,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || ''
        }));
      } else {
        navigate('/login');
      }
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [navigate]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    // Simulate API call
    setTimeout(() => {
      console.log('Profile update:', formData);
      localStorage.setItem('user', JSON.stringify({
        ...user,
        ...formData
      }));
      setIsSaving(false);
      setSaveSuccess(true);
      
      setTimeout(() => {
        navigate('/profile');
      }, 1000);
    }, 1500);
  };

  if (loading) {
    return (
      <>
        <Navbar showLogout={true} />
        <div className="edit-profile-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar showLogout={true} />
      <div className="edit-profile-container">
        <div className="edit-profile-card">
          <div className="edit-header">
            <button className="back-button" onClick={() => navigate('/profile')}>
              ← Back
            </button>
            <h1>Edit Profile</h1>
          </div>

          {saveSuccess && (
            <div className="success-message">
              ✓ Profile updated successfully! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit} className="edit-form">
            <div className="form-section">
              <h3>Personal Information</h3>
              <div className="form-row">
                <InputField
                  label="First Name"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={errors.firstName}
                  required
                />
                <InputField
                  label="Last Name"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={errors.lastName}
                  required
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Contact Information</h3>
              <InputField
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
              />
              <InputField
                label="Phone Number"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                required
              />
            </div>

            <div className="form-section">
              <h3>Delivery Address</h3>
              <InputField
                label="Street Address"
                type="text"
                name="address"
                placeholder="123 Main Street"
                value={formData.address}
                onChange={handleChange}
              />
              <div className="form-row">
                <InputField
                  label="City"
                  type="text"
                  name="city"
                  placeholder="New York"
                  value={formData.city}
                  onChange={handleChange}
                />
                <InputField
                  label="State"
                  type="text"
                  name="state"
                  placeholder="NY"
                  value={formData.state}
                  onChange={handleChange}
                />
              </div>
              <InputField
                label="ZIP Code"
                type="text"
                name="zipCode"
                placeholder="10001"
                value={formData.zipCode}
                onChange={handleChange}
              />
            </div>

            <div className="form-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/profile')}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSaving}
                disabled={isSaving}
                fullWidth
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}