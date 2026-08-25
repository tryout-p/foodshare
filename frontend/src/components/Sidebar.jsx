import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, Gift, ClipboardList, MapPin, 
  User, LogOut, Users, MessageCircle, AlertTriangle 
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
    if (onClose) onClose();
  };

  const getMenuLinks = () => {
    switch (user.role) {
      case 'Donor':
        return [
          { to: '/dashboard/donor', label: 'Overview', icon: <LayoutDashboard size={18} /> },
          { to: '/dashboard/donor/donations', label: 'My Donations', icon: <Gift size={18} /> },
          { to: '/dashboard/donor/pickups', label: 'Pickups', icon: <MapPin size={18} /> },
          { to: '/dashboard/profile', label: 'My Profile', icon: <User size={18} /> },
        ];
      case 'NGO':
        return [
          { to: '/dashboard/ngo', label: 'Overview', icon: <LayoutDashboard size={18} /> },
          { to: '/dashboard/ngo/available', label: 'Available Food', icon: <Gift size={18} /> },
          { to: '/dashboard/ngo/requests', label: 'Requested Food', icon: <ClipboardList size={18} /> },
          { to: '/dashboard/ngo/pickups', label: 'Pickup Schedule', icon: <MapPin size={18} /> },
          { to: '/dashboard/profile', label: 'NGO Profile', icon: <User size={18} /> },
        ];
      case 'Admin':
        return [
          { to: '/dashboard/admin', label: 'Admin Metrics', icon: <LayoutDashboard size={18} /> },
          { to: '/dashboard/admin/users', label: 'Manage Users', icon: <Users size={18} /> },
          { to: '/dashboard/admin/donations', label: 'Manage Donations', icon: <Gift size={18} /> },
          { to: '/dashboard/admin/requests', label: 'Manage Requests', icon: <ClipboardList size={18} /> },
          { to: '/dashboard/admin/pickups', label: 'Manage Pickups', icon: <MapPin size={18} /> },
          { to: '/dashboard/profile', label: 'My Profile', icon: <User size={18} /> },
        ];
      default:
        return [];
    }
  };

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.25rem' }}>
            <div className="logo-icon" style={{ width: '28px', height: '28px' }}>
              <LayoutDashboard size={14} fill="white" />
            </div>
            FoodShare
          </div>
          <button className="sidebar-close-btn" onClick={onClose} style={{ display: 'none', color: 'var(--text-muted)' }}>
            ✕
          </button>
        </div>

        <nav className="sidebar-menu">
          {getMenuLinks().map((link, idx) => (
            <NavLink
              key={idx}
              to={link.to}
              end
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="user-info-box" style={{ flex: 1 }}>
            <h5 style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '120px' }}>{user.name}</h5>
            <p>{user.role}</p>
          </div>
          <button onClick={handleLogout} className="btn-icon-action danger" title="Logout" style={{ padding: '0.4rem' }}>
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Styles for mobile sidebar toggle responsiveness */}
      <style>{`
        @media (max-width: 768px) {
          .sidebar-close-btn {
            display: block !important;
          }
          .sidebar.mobile-open {
            transform: translateX(0) !important;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
