import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { User, Phone, MapPin, KeyRound, Save } from 'lucide-react';

const validatePhone = (phone) => {
  if (!phone || phone.trim() === '') return true;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 13;
};

const Profile = () => {
  const { user, updateProfile, changePassword } = useContext(AuthContext);

  // Profile Details Form State
  const [name, setName] = useState(user?.name || '');
  const [contactNumber, setContactNumber] = useState(user?.contactNumber || '');
  const [address, setAddress] = useState(user?.address || '');

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Alerts
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');

  const [profileLoading, setProfileLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');
    setProfileLoading(true);

    try {
      if (contactNumber && !validatePhone(contactNumber)) {
        throw new Error('Please enter a valid mobile number (10-13 digits)');
      }
      await updateProfile(name, contactNumber, address);
      setProfileMsg('Profile updated successfully!');
    } catch (err) {
      setProfileErr(err.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPassMsg('');
    setPassErr('');

    if (newPassword !== confirmPassword) {
      setPassErr('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPassErr('New password must be at least 6 characters');
      return;
    }

    setPassLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPassMsg('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassErr(err.message || 'Failed to update password');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="main-panel-container">
      <div className="panel-header">
        <div className="panel-title">
          <h2>Account Profile Settings</h2>
          <p>Update your personal information, address location, and security credentials.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Left Column: Personal details */}
        <div className="content-card">
          <div className="content-card-header">
            <h3>Contact Information</h3>
          </div>

          {profileMsg && <div className="alert alert-success">{profileMsg}</div>}
          {profileErr && <div className="alert alert-error">{profileErr}</div>}

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label>Organization / User Full Name *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
                <User size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Email Address (Disabled)</label>
                <input
                  type="email"
                  className="form-input"
                  value={user?.email || ''}
                  disabled
                  style={{ backgroundColor: 'var(--bg-dashboard)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                />
              </div>
              <div className="form-group">
                <label>Account Role (Disabled)</label>
                <input
                  type="text"
                  className="form-input"
                  value={user?.role || ''}
                  disabled
                  style={{ backgroundColor: 'var(--bg-dashboard)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Contact Phone Number</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. +91 98765 43210"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Phone size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              </div>
            </div>

            <div className="form-group">
              <label>Physical Address (Defaults for listings/pickups) *</label>
              <div style={{ position: 'relative' }}>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Street, City, Pin Code"
                  required
                />
                <MapPin size={16} style={{ position: 'absolute', left: '0.85rem', top: '1rem', color: 'var(--text-light)' }} />
              </div>
            </div>

            <button type="submit" className="btn-form" style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={profileLoading}>
              <Save size={16} /> {profileLoading ? 'Saving...' : 'Save Profile Details'}
            </button>
          </form>
        </div>

        {/* Right Column: Security changes */}
        <div className="content-card">
          <div className="content-card-header">
            <h3>Change Account Password</h3>
          </div>

          {passMsg && <div className="alert alert-success">{passMsg}</div>}
          {passErr && <div className="alert alert-error">{passErr}</div>}

          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label>Current Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
                <KeyRound size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              </div>
            </div>

            <div className="form-group">
              <label>New Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-input"
                  placeholder="•••••••• (Min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
                <KeyRound size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              </div>
            </div>

            <div className="form-group">
              <label>Confirm New Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
                <KeyRound size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              </div>
            </div>

            <button type="submit" className="btn-form" style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: '#334155' }} disabled={passLoading}>
              <KeyRound size={16} /> {passLoading ? 'Updating Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
