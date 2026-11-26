import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FormContainer from '../components/FormContainer';
import InputField from '../components/InputField';
import Button from '../components/Button';
import './styles/Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Login attempt:', formData);
      localStorage.setItem('user', JSON.stringify({
        email: formData.email,
        isLoggedIn: true
      }));
      setIsLoading(false);
      navigate('/profile');
    }, 1500);
  };

  const isFormValid = formData.email.trim() && formData.password.trim();

  return (
    <FormContainer
      title="Welcome Back"
      subtitle="Sign in to your account to continue"
      onSubmit={handleSubmit}
    >
      <InputField
        label="Email Address"
        type="email"
        name="email"
        placeholder="you@example.com"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        required
      />

      <InputField
        label="Password"
        type="password"
        name="password"
        placeholder="••••••••"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        required
      />

      <div className="login-aux-row">
        <a href="#" className="forgot-password">Forgot Password?</a>
      </div>

      <Button
        type="submit"
        variant="primary"
        disabled={!isFormValid || isLoading}
        isLoading={isLoading}
        fullWidth
      >
        {isLoading ? 'Signing In...' : 'Sign In'}
      </Button>

      <div className="form-footer">
        <p>Don't have an account? <Link to="/register">Sign up here</Link></p>
      </div>
    </FormContainer>
  );
}