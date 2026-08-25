import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Leaf, ArrowLeft, Heart } from 'lucide-react';

const Auth = () => {
  const { user, login, register, error: authError } = useContext(AuthContext);
  const navigate = useNavigate();

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

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      navigate(`/dashboard/${user.role.toLowerCase()}`);
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        if (!email || !password) {
          throw new Error('Please fill in all fields');
        }
        await login(email, password);
      } else {
        if (!name || !email || !password || !role) {
          throw new Error('Please fill in all required fields');
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
    <div className="auth-container">
      {/* Side Brand Information */}
      <div className="auth-sidebar">
        <Link to="/" style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', fontSize: '1.25rem', fontWeight: 800 }}>
          <Leaf size={24} fill="white" />
          FoodShare
        </Link>
        <Heart size={48} fill="white" style={{ marginBottom: '1.5rem', opacity: 0.9 }} />
        <h2>Save Food, Feed Hope</h2>
        <p>
          Join a growing community linking food businesses, catering services, and home donors with local NGOs to feed those in need and stop waste.
        </p>
      </div>

      {/* Auth Form Interface */}
      <div className="auth-main">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem', fontWeight: 500 }}>
          <ArrowLeft size={16} /> Back to home
        </Link>

        <div className="auth-form-card">
          <h3>{isLogin ? 'Welcome Back' : 'Create Account'}</h3>
          <p>{isLogin ? 'Log in to manage your donations and requests.' : 'Register as a Donor or NGO to start redistributing food.'}</p>

          {error && <div className="alert alert-error">{error}</div>}
          {authError && !error && <div className="alert alert-error">{authError}</div>}

          <form onSubmit={handleSubmit}>
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

            {!isLogin && (
              <>
                <div className="form-group">
                  <label htmlFor="reg-role">Role (Account Type) *</label>
                  <select
                    id="reg-role"
                    className="form-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  >
                    <option value="Donor">Donor (Surplus Food Provider)</option>
                    <option value="NGO">NGO (Food Requester & Distributor)</option>
                  </select>
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

            <button type="submit" className="btn-form" disabled={loading}>
              {loading ? 'Processing...' : isLogin ? 'Log In' : 'Create Account'}
            </button>
          </form>

          <div className="auth-toggle">
            {isLogin ? (
              <p>
                Don't have an account? <span onClick={() => setIsLogin(false)}>Sign Up</span>
              </p>
            ) : (
              <p>
                Already have an account? <span onClick={() => setIsLogin(true)}>Log In</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
