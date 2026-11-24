import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import './styles/Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading user data
    const timer = setTimeout(() => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        navigate('/login');
      }
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [navigate]);

  if (loading) {
    return (
      <>
        <Navbar showLogout={true} />
        <div className="profile-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar showLogout={true} />
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {user?.firstName?.charAt(0) || 'U'}
            </div>
            <div className="profile-info">
              <h1 className="profile-name">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="profile-email">{user?.email}</p>
            </div>
            <Link to="/edit-profile" className="edit-button-link">
              <Button variant="secondary">Edit Profile</Button>
            </Link>
          </div>

          <div className="profile-details">
            <div className="detail-group">
              <h3>Personal Information</h3>
              <div className="detail-item">
                <label>First Name</label>
                <p>{user?.firstName}</p>
              </div>
              <div className="detail-item">
                <label>Last Name</label>
                <p>{user?.lastName}</p>
              </div>
              <div className="detail-item">
                <label>Email Address</label>
                <p>{user?.email}</p>
              </div>
              <div className="detail-item">
                <label>Phone Number</label>
                <p>{user?.phone || 'Not provided'}</p>
              </div>
            </div>

            <div className="detail-group">
              <h3>Account Settings</h3>
              <div className="detail-item">
                <label>Account Status</label>
                <p className="status active">Active</p>
              </div>
              <div className="detail-item">
                <label>Member Since</label>
                <p>{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="detail-group">
              <h3>Delivery Address</h3>
              <div className="detail-item">
                <label>Default Address</label>
                <p>Not set. <a href="#">Add address</a></p>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <Button variant="secondary" fullWidth>Change Password</Button>
          </div>
        </div>
      </div>
    </>
  );
}