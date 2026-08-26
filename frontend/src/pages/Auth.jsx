import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Leaf, ArrowLeft, Heart, Gift } from 'lucide-react';

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const validatePhone = (phone) => {
  if (!phone || phone.trim() === '') return true;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 13;
};

const Auth = () => {
  const { user, login, register, error: authError } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Donor');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');

  // Sync mode state from navigation links (Login vs Sign Up)
  useEffect(() => {
    if (location.state?.mode === 'login') {
      setIsLogin(true);
    } else if (location.state?.mode === 'signup') {
      setIsLogin(false);
    }
  }, [location.state]);

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      navigate(`/dashboard/${user.role.toLowerCase()}`);
    }
  }, [user, navigate]);

  // Calculate dynamic password strength on typing
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { label: '', color: '', width: '0%' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    switch (score) {
      case 0:
      case 1:
      case 2:
        return { label: 'Weak', color: '#ef4444', width: '33%' };
      case 3:
      case 4:
        return { label: 'Medium', color: '#f59e0b', width: '66%' };
      case 5:
        return { label: 'Strong', color: '#10b981', width: '100%' };
      default:
        return { label: '', color: '', width: '0%' };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        if (!email || !password) {
          throw new Error('Please fill in all fields');
        }
        if (!validateEmail(email)) {
          throw new Error('Please enter a valid email address');
        }
        await login(email, password);
      } else {
        if (!name || !email || !password || !role) {
          throw new Error('Please fill in all required fields');
        }
        if (!validateEmail(email)) {
          throw new Error('Please enter a valid email address');
        }
        if (contactNumber && !validatePhone(contactNumber)) {
          throw new Error('Please enter a valid contact number (10-13 digits)');
        }
        await register(name, email, password, role, contactNumber, address);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* 3D background blur blobs */}
      <div className="bg-blur-decorations">
        <div className="blur-blob blob-green" style={{ width: '450px', height: '450px', top: '-10%', left: '-5%' }}></div>
        <div className="blur-blob blob-mint" style={{ width: '500px', height: '500px', bottom: '-15%', right: '-5%' }}></div>
      </div>

      {/* Floating glassmorphic central card */}
      <div className="auth-card glass-panel">
        
        {/* Left Side: Branding and Info */}
        <div className="auth-card-sidebar">
          <Link to="/" className="auth-logo">
            <Leaf size={24} fill="white" />
            <span>FoodShare</span>
          </Link>
          <div className="sidebar-info-content">
            <Heart size={44} fill="white" className="pulse-heart" />
            <h2>Save Food,<br />Feed Hope.</h2>
            <p>
              Join a growing community connecting food banquets, caterers, and bakeries with local verified NGOs to stop waste.
            </p>
          </div>
          <div className="sidebar-footer-labels">
            <span>🌱 Zero Wastage</span>
            <span>🤝 Verified Trust</span>
          </div>
        </div>

        {/* Right Side: Form Interface */}
        <div className="auth-card-form-area">
          <Link to="/" className="back-link">
            <ArrowLeft size={16} /> Back to home
          </Link>

          {/* Dynamic Tab Switcher */}
          <div className="auth-tabs">
            <button 
              type="button"
              className={`auth-tab-btn ${isLogin ? 'active-tab' : ''}`}
              onClick={() => { setError(''); setIsLogin(true); }}
            >
              Log In
            </button>
            <button 
              type="button"
              className={`auth-tab-btn ${!isLogin ? 'active-tab' : ''}`}
              onClick={() => { setError(''); setIsLogin(false); }}
            >
              Sign Up
            </button>
          </div>

          <div className="auth-form-wrapper">
            <h3 className="auth-greeting-title">
              {isLogin ? 'Welcome Back!' : 'Create Account'}
            </h3>
            <p className="auth-greeting-desc">
              {isLogin ? 'Log in to manage your donations and requests.' : 'Register as a Donor or NGO to start redistributing.'}
            </p>

            {error && <div className="alert alert-error">{error}</div>}
            {authError && !error && <div className="alert alert-error">{authError}</div>}

            <form onSubmit={handleSubmit} className="auth-form-flow">
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="reg-name">Full Name / Organization *</label>
                  <input
                    id="reg-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Green Palace Hotel, Charity Trust"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="auth-email">Email Address *</label>
                <input
                  id="auth-email"
                  type="email"
                  className="form-input"
                  placeholder="e.g. user@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="auth-password">Password *</label>
                <input
                  id="auth-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Password strength progress meter (Sign up only) */}
              {!isLogin && password && (
                <div className="password-strength-container">
                  <div className="strength-bar-bg">
                    <div 
                      className="strength-bar-fill" 
                      style={{ 
                        width: getPasswordStrength(password).width, 
                        backgroundColor: getPasswordStrength(password).color 
                      }}
                    ></div>
                  </div>
                  <span className="strength-label" style={{ color: getPasswordStrength(password).color }}>
                    Password Strength: <strong>{getPasswordStrength(password).label}</strong>
                  </span>
                </div>
              )}

              {!isLogin && (
                <>
                  {/* Visual Account Type / Role Cards */}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Account Type *</label>
                    <div className="role-selection-grid">
                      <div 
                        className={`role-select-card ${role === 'Donor' ? 'role-selected' : ''}`}
                        onClick={() => setRole('Donor')}
                      >
                        <Gift size={22} className="role-card-icon" />
                        <div className="role-card-text">
                          <h4>Donor</h4>
                          <p>List surplus meals</p>
                        </div>
                      </div>

                      <div 
                        className={`role-select-card ${role === 'NGO' ? 'role-selected' : ''}`}
                        onClick={() => setRole('NGO')}
                      >
                        <Heart size={22} className="role-card-icon" />
                        <div className="role-card-text">
                          <h4>NGO</h4>
                          <p>Request surplus meals</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="reg-phone">Contact Number</label>
                    <input
                      id="reg-phone"
                      type="tel"
                      className="form-input"
                      placeholder="e.g. +91 98765 43210"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="reg-address">Default Address (for Pickups) *</label>
                    <textarea
                      id="reg-address"
                      className="form-textarea"
                      rows="3"
                      placeholder="Provide detailed physical address..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required={role === 'Donor'}
                    />
                  </div>
                </>
              )}

              <button type="submit" className="btn-form" style={{ marginTop: '1.25rem' }} disabled={loading}>
                {loading ? 'Processing...' : isLogin ? 'Log In' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Auth;
