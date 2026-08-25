import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  Users, Gift, ClipboardList, MapPin, Trash2, 
  Settings, Award, Search, ShieldAlert, CheckCircle, Database, ArrowLeft, ArrowRight
} from 'lucide-react';

const AdminDashboard = () => {
  const { token } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonors: 0,
    totalNGOs: 0,
    totalDonations: 0,
    totalRequests: 0,
    totalPickups: 0,
    mealsSaved: 224
  });

  const [users, setUsers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [pickups, setPickups] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Determine active tab from the URL pathname
  let activeTab = 'overview';
  const path = location.pathname;
  if (path.endsWith('/users')) activeTab = 'users';
  else if (path.endsWith('/donations')) activeTab = 'donations';
  else if (path.endsWith('/requests')) activeTab = 'requests';
  else if (path.endsWith('/pickups')) activeTab = 'pickups';

  // Fetch metrics
  const fetchStats = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching admin statistics:', err);
    }
  };

  // Fetch specific tab data
  const fetchTabDetails = async () => {
    if (!token || activeTab === 'overview') return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      let url = '';
      if (activeTab === 'users') url = '/api/admin/users';
      else if (activeTab === 'donations') url = '/api/admin/donations';
      else if (activeTab === 'requests') url = '/api/admin/requests';
      else if (activeTab === 'pickups') url = '/api/admin/pickups';

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        if (activeTab === 'users') setUsers(data);
        else if (activeTab === 'donations') setDonations(data);
        else if (activeTab === 'requests') setRequests(data);
        else if (activeTab === 'pickups') setPickups(data);
      } else {
        throw new Error(data.message || `Failed to fetch ${activeTab}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  useEffect(() => {
    fetchTabDetails();
    setSearchTerm(''); // Clear search on tab changes
  }, [token, activeTab]);

  const handleDelete = async (id, collection) => {
    if (!window.confirm(`Are you sure you want to permanently delete this ${collection.slice(0, -1)}?`)) return;

    try {
      const res = await fetch(`/api/admin/${collection}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`${collection.slice(0, -1).toUpperCase()} deleted successfully!`);
        fetchStats();
        fetchTabDetails();
      } else {
        throw new Error(data.message || 'Failed to delete record');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available': return <span className="badge badge-available">Available</span>;
      case 'Requested': return <span className="badge badge-requested">Requested</span>;
      case 'Reserved': return <span className="badge badge-reserved">Reserved</span>;
      case 'Completed': return <span className="badge badge-completed">Completed</span>;
      case 'Pending': return <span className="badge badge-pending">Pending</span>;
      case 'Scheduled': return <span className="badge badge-scheduled">Scheduled</span>;
      case 'Picked Up': return <span className="badge badge-pickedup">Picked Up</span>;
      case 'Delivered': return <span className="badge badge-delivered">Delivered</span>;
      case 'Approved': return <span className="badge badge-available">Approved</span>;
      case 'Rejected': return <span className="badge badge-rejected">Rejected</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  // Search filters
  const getFilteredItems = () => {
    if (activeTab === 'users') {
      return users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else if (activeTab === 'donations') {
      return donations.filter(d => 
        d.foodName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        d.donorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        d.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else if (activeTab === 'requests') {
      return requests.filter(r => 
        r.donationDetails?.foodName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.ngoName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else if (activeTab === 'pickups') {
      return pickups.filter(p => 
        p.donationDetails?.foodName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return [];
  };

  return (
    <div className="main-panel-container">
      {/* Header section with conditional Title */}
      <div className="panel-header">
        <div className="panel-title">
          {activeTab === 'overview' ? (
            <>
              <h2>Admin Dashboard Overview</h2>
              <p>Global metrics aggregation and platform management control center.</p>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <Link to="/dashboard/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                <ArrowLeft size={14} /> Back to Overview
              </Link>
              <h2 style={{ textTransform: 'capitalize' }}>Manage {activeTab}</h2>
            </div>
          )}
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* RENDER VIEW 1: OVERVIEW METRICS DASHBOARD */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="metric-card">
              <div className="metric-details">
                <p>Total Users</p>
                <h3>{stats.totalUsers}</h3>
              </div>
              <div className="metric-icon" style={{ backgroundColor: 'var(--primary-light)' }}><Users size={20} /></div>
            </div>
            <div className="metric-card">
              <div className="metric-details">
                <p>Food Donations</p>
                <h3>{stats.totalDonations}</h3>
              </div>
              <div className="metric-icon" style={{ backgroundColor: 'var(--primary-light)' }}><Gift size={20} /></div>
            </div>
            <div className="metric-card">
              <div className="metric-details">
                <p>NGO Requests</p>
                <h3>{stats.totalRequests}</h3>
              </div>
              <div className="metric-icon" style={{ backgroundColor: 'var(--primary-light)' }}><ClipboardList size={20} /></div>
            </div>
            <div className="metric-card">
              <div className="metric-details">
                <p>Meals Saved</p>
                <h3>{stats.mealsSaved}</h3>
              </div>
              <div className="metric-icon" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}><Award size={20} /></div>
            </div>
          </div>

          {/* Quick Shortcuts & Platform Breakdown */}
          <div className="dashboard-grid">
            <div className="content-card">
              <div className="content-card-header">
                <h3>Quick Admin Navigation</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Select a database table below to perform complete verification, search/filter, and deletion operations on active entities.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="preview-item" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/admin/users')}>
                  <div>
                    <h4 style={{ color: 'var(--primary)' }}>Users Directory</h4>
                    <p style={{ fontSize: '0.75rem' }}>Review accounts ({stats.totalUsers})</p>
                  </div>
                  <ArrowRight size={16} />
                </div>
                <div className="preview-item" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/admin/donations')}>
                  <div>
                    <h4 style={{ color: 'var(--primary)' }}>Donation Listings</h4>
                    <p style={{ fontSize: '0.75rem' }}>Manage listed food ({stats.totalDonations})</p>
                  </div>
                  <ArrowRight size={16} />
                </div>
                <div className="preview-item" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/admin/requests')}>
                  <div>
                    <h4 style={{ color: 'var(--primary)' }}>NGO Food Requests</h4>
                    <p style={{ fontSize: '0.75rem' }}>Track requests inbox ({stats.totalRequests})</p>
                  </div>
                  <ArrowRight size={16} />
                </div>
                <div className="preview-item" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/admin/pickups')}>
                  <div>
                    <h4 style={{ color: 'var(--primary)' }}>Pickup Trackers</h4>
                    <p style={{ fontSize: '0.75rem' }}>Schedule status flow ({stats.totalPickups})</p>
                  </div>
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>

            <div className="content-card">
              <div className="content-card-header">
                <h3>System Breakdown</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
                <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Registered Donors</span>
                  <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{stats.totalDonors}</strong>
                </div>
                <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>NGO Partners</span>
                  <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{stats.totalNGOs}</strong>
                </div>
                <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Active Pickups</span>
                  <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{stats.totalPickups}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER VIEW 2: SPECIFIC DISTRIBUTED TABLES */}
      {activeTab !== 'overview' && (
        <div className="content-card">
          {/* Sub Navigation tabs + Search bar */}
          <div className="content-card-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`} 
                style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem' }}
                onClick={() => navigate('/dashboard/admin/users')}
              >
                Users ({stats.totalUsers})
              </button>
              <button 
                className={`sidebar-item ${activeTab === 'donations' ? 'active' : ''}`}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem' }}
                onClick={() => navigate('/dashboard/admin/donations')}
              >
                Donations ({stats.totalDonations})
              </button>
              <button 
                className={`sidebar-item ${activeTab === 'requests' ? 'active' : ''}`}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem' }}
                onClick={() => navigate('/dashboard/admin/requests')}
              >
                Requests ({stats.totalRequests})
              </button>
              <button 
                className={`sidebar-item ${activeTab === 'pickups' ? 'active' : ''}`}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem' }}
                onClick={() => navigate('/dashboard/admin/pickups')}
              >
                Pickups ({stats.totalPickups})
              </button>
            </div>

            {/* Search bar */}
            <div style={{ position: 'relative', width: '240px' }}>
              <input
                type="text"
                className="form-input"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.2rem', paddingTop: '0.4rem', paddingBottom: '0.4rem', borderRadius: '20px', fontSize: '0.85rem' }}
              />
              <Search size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
            </div>
          </div>

          {loading ? (
            <div className="spinner-container">
              <div className="spinner"></div>
              <p>Querying {activeTab} database...</p>
            </div>
          ) : (
            <div className="table-container">
              {getFilteredItems().length === 0 ? (
                <div className="empty-state">
                  <Database className="empty-state-icon" />
                  <h4>No Records Found</h4>
                  <p>No listings exist in this collection matching search inputs.</p>
                </div>
              ) : (
                <>
                  {/* Users Tab */}
                  {activeTab === 'users' && (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Phone</th>
                          <th>Address</th>
                          <th>Registered</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredItems().map((u) => (
                          <tr key={u._id}>
                            <td style={{ fontWeight: 600 }}>{u.name}</td>
                            <td>{u.email}</td>
                            <td>
                              <span className={`badge ${u.role === 'Admin' ? 'badge-rejected' : u.role === 'Donor' ? 'badge-available' : 'badge-requested'}`}>
                                {u.role}
                              </span>
                            </td>
                            <td>{u.contactNumber || '-'}</td>
                            <td style={{ maxWidth: '150px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {u.address || '-'}
                            </td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td>
                              <button 
                                className="btn-icon-action danger" 
                                title="Delete User"
                                onClick={() => handleDelete(u._id, 'users')}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Donations Tab */}
                  {activeTab === 'donations' && (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Food Item</th>
                          <th>Donor Name</th>
                          <th>Category</th>
                          <th>Quantity</th>
                          <th>Created</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredItems().map((d) => (
                          <tr key={d._id}>
                            <td style={{ fontWeight: 600 }}>{d.foodName}</td>
                            <td>{d.donorName}</td>
                            <td>{d.category}</td>
                            <td>{d.quantity}</td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {new Date(d.createdAt).toLocaleDateString()}
                            </td>
                            <td>{getStatusBadge(d.status)}</td>
                            <td>
                              <button 
                                className="btn-icon-action danger" 
                                title="Delete Listing"
                                onClick={() => handleDelete(d._id, 'donations')}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Requests Tab */}
                  {activeTab === 'requests' && (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Food Item</th>
                          <th>NGO Name</th>
                          <th>Message</th>
                          <th>Created</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredItems().map((r) => (
                          <tr key={r._id}>
                            <td style={{ fontWeight: 600 }}>{r.donationDetails?.foodName || 'Deleted Food'}</td>
                            <td>{r.ngoName}</td>
                            <td style={{ maxWidth: '200px', fontStyle: 'italic', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {r.message || '-'}
                            </td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {new Date(r.createdAt).toLocaleDateString()}
                            </td>
                            <td>{getStatusBadge(r.status)}</td>
                            <td>
                              <button 
                                className="btn-icon-action danger" 
                                title="Delete Request"
                                onClick={() => handleDelete(r._id, 'requests')}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Pickups Tab */}
                  {activeTab === 'pickups' && (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Food Item</th>
                          <th>Pickup Address</th>
                          <th>Schedule</th>
                          <th>Status Flow</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredItems().map((p) => (
                          <tr key={p._id}>
                            <td style={{ fontWeight: 600 }}>{p.donationDetails?.foodName || 'Deleted Food'}</td>
                            <td style={{ maxWidth: '200px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {p.pickupAddress}
                            </td>
                            <td style={{ fontSize: '0.8rem' }}>
                              {p.status === 'Pending' ? (
                                <span style={{ fontStyle: 'italic', color: 'var(--text-light)' }}>Unscheduled</span>
                              ) : (
                                `${p.pickupDate} at ${p.pickupTime}`
                              )}
                            </td>
                            <td>{getStatusBadge(p.status)}</td>
                            <td>
                              <button 
                                className="btn-icon-action danger" 
                                title="Delete Pickup"
                                onClick={() => handleDelete(p._id, 'pickups')}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
