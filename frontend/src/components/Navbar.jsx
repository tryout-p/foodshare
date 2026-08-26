import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Bell, Menu, Leaf, User, LogOut, Info, Gift, MessageSquare, CheckCircle, Truck } from 'lucide-react';

const Navbar = ({ onMenuToggle }) => {
  const { user, token, logout } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 10 seconds for real-time responsiveness
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [token]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      try {
        await fetch(`/api/notifications/${notif._id}/read`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        fetchNotifications();
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }
    setShowDropdown(false);

    // Redirect to relevant tab/dashboard based on notification type
    if (notif.type === 'Donation') {
      navigate(user.role === 'NGO' ? '/dashboard/ngo' : '/dashboard/donor');
    } else if (notif.type === 'Request' || notif.type === 'Approval') {
      navigate(user.role === 'NGO' ? '/dashboard/ngo' : '/dashboard/donor');
    } else if (notif.type === 'Pickup') {
      navigate(user.role === 'NGO' ? '/dashboard/ngo' : '/dashboard/donor');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'Registration': return <User size={16} />;
      case 'Donation': return <Gift size={16} />;
      case 'Request': return <MessageSquare size={16} />;
      case 'Approval': return <CheckCircle size={16} />;
      case 'Pickup': return <Truck size={16} />;
      default: return <Info size={16} />;
    }
  };

  return (
    <header className="landing-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user && (
          <button className="sidebar-toggle-btn" onClick={onMenuToggle} style={{ display: 'none', color: 'var(--text-main)' }}>
            <Menu size={24} />
          </button>
        )}
        <Link to="/" className="brand-logo">
          <div className="logo-icon">
            <Leaf size={18} fill="white" />
          </div>
          FoodShare
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {user ? (
          <>
            {/* Notification Bell */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                className="notification-bell-btn"
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label="Toggle notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>

              {showDropdown && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h4>Notifications</h4>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead}>Mark all as read</button>
                    )}
                  </div>
                  <div className="notifications-list">
                    {notifications.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif._id}
                          className={`notification-item ${!notif.read ? 'unread' : ''}`}
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <div className="notification-item-icon">
                            {getNotificationIcon(notif.type)}
                          </div>
                          <div className="notification-item-content">
                            <h5 style={{ fontWeight: !notif.read ? '700' : '500' }}>{notif.title}</h5>
                            <p>{notif.message}</p>
                            <span>{new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Go to Dashboard button / Logout button */}
            <Link to={`/dashboard/${user.role.toLowerCase()}`} className="btn-header-dashboard">
              Go to dashboard
            </Link>
          </>
        ) : (
          <div className="navbar-nav-links">
            <Link to="/" className={`navbar-link-item ${isActive('/') ? 'active' : ''}`}>Home</Link>
            <Link to="/about" className={`navbar-link-item ${isActive('/about') ? 'active' : ''}`}>About</Link>
            <Link to="/contact" className={`navbar-link-item ${isActive('/contact') ? 'active' : ''}`}>Contact</Link>
            <Link to="/auth" state={{ mode: 'login' }} className={`navbar-link-item login-link ${isActive('/auth') ? 'active' : ''}`}>Login</Link>
            <Link to="/auth" state={{ mode: 'signup' }} className="btn-header-dashboard get-started-btn">
              Get Started
            </Link>
          </div>
        )}
      </div>

      {/* Inline styles for responsive Navbar mobile toggle button visibility */}
      <style>{`
        @media (max-width: 768px) {
          .sidebar-toggle-btn {
            display: block !important;
          }
          .btn-header-dashboard {
            padding: 0.5rem 0.9rem !important;
            font-size: 0.8rem !important;
          }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
