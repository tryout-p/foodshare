import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  Gift, CheckCircle, Clock, MapPin, Edit2, 
  Trash2, Plus, ArrowLeft, ArrowRight, Check, X, Truck
} from 'lucide-react';

const DonorDashboard = () => {
  const { token, user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });
  
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editDonationId, setEditDonationId] = useState(null);
  const [foodName, setFoodName] = useState('');
  const [category, setCategory] = useState('Cooked Meal');
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [pickupAddress, setPickupAddress] = useState(user?.address || '');
  const [description, setDescription] = useState('');

  // Derive active tab from URL path
  let activeTab = 'overview';
  const path = location.pathname;
  if (path.endsWith('/donations')) activeTab = 'donations';
  else if (path.endsWith('/pickups')) activeTab = 'pickups';

  // Fetch Dashboard Data
  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      // Fetch my donations
      const donRes = await fetch('/api/donations/my-donations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const donData = await donRes.json();

      // Fetch received requests
      const reqRes = await fetch('/api/requests/received', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const reqData = await reqRes.json();

      // Fetch pickups
      const pickRes = await fetch('/api/pickups', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const pickData = await pickRes.json();

      if (donRes.ok) setDonations(donData);
      if (reqRes.ok) setRequests(reqData);
      if (pickRes.ok) setPickups(pickData);

      // Compute Stats
      if (donRes.ok) {
        const total = donData.length;
        const active = donData.filter(d => ['Available', 'Requested', 'Reserved'].includes(d.status)).length;
        const completed = donData.filter(d => d.status === 'Completed').length;
        setStats({ total, active, completed });
      }
    } catch (err) {
      console.error('Error fetching donor dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!foodName || !category || !quantity || !expiryDate || !pickupAddress) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const url = editDonationId ? `/api/donations/${editDonationId}` : '/api/donations';
      const method = editDonationId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ foodName, category, quantity, expiryDate, pickupAddress, description })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit donation');
      }

      setMessage(editDonationId ? 'Donation updated successfully!' : 'Donation added successfully!');
      setShowAddForm(false);
      resetForm();
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setEditDonationId(null);
    setFoodName('');
    setCategory('Cooked Meal');
    setQuantity('');
    setExpiryDate('');
    setPickupAddress(user?.address || '');
    setDescription('');
  };

  const handleEditClick = (don) => {
    setEditDonationId(don._id);
    setFoodName(don.foodName);
    setCategory(don.category);
    setQuantity(don.quantity);
    const d = new Date(don.expiryDate);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d - tzOffset)).toISOString().slice(0, 16);
    setExpiryDate(localISOTime);
    setPickupAddress(don.pickupAddress);
    setDescription(don.description || '');
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/donations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage('Donation deleted successfully!');
        fetchData();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to delete donation');
      }
    } catch (err) {
      setError('Server error');
    }
  };

  const handleRequestApproval = async (reqId, approve) => {
    const action = approve ? 'approve' : 'reject';
    try {
      const res = await fetch(`/api/requests/${reqId}/${action}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Request successfully ${approve ? 'approved' : 'rejected'}!`);
        fetchData();
      } else {
        setError(data.message || `Failed to process request`);
      }
    } catch (err) {
      setError('Server error');
    }
  };

  const handlePickupStatus = async (pickupId, nextStatus) => {
    try {
      const res = await fetch(`/api/pickups/${pickupId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        setMessage(`Pickup marked as ${nextStatus}!`);
        fetchData();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to update pickup status');
      }
    } catch (err) {
      setError('Server error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available': return <span className="badge badge-available">Available</span>;
      case 'Requested': return <span className="badge badge-requested">Requested</span>;
      case 'Reserved': return <span className="badge badge-reserved">Reserved</span>;
      case 'Completed': return <span className="badge badge-completed">Completed</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="main-panel-container">
      {/* Dynamic Header */}
      <div className="panel-header">
        <div className="panel-title">
          {activeTab === 'overview' ? (
            <>
              <h2>Donor Workspace</h2>
              <p>Review metrics statistics and process incoming requests.</p>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <Link to="/dashboard/donor" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                <ArrowLeft size={14} /> Back to Overview
              </Link>
              <h2 style={{ textTransform: 'capitalize' }}>
                {activeTab === 'donations' ? 'Manage Donations' : 'Pickup Schedule'}
              </h2>
            </div>
          )}
        </div>
        
        {activeTab === 'donations' && (
          <button className="btn-primary" onClick={() => { resetForm(); setShowAddForm(true); }}>
            <Plus size={18} /> List Food Donation
          </button>
        )}
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Add / Edit Form Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <button className="modal-close" onClick={() => setShowAddForm(false)}>✕</button>
            <div className="modal-header">
              <h3>{editDonationId ? 'Edit Donation Listing' : 'List Surplus Food'}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Provide details about the food surplus you wish to donate.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Food Item / Dish Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Veg Biryani, Bread rolls"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Food Category *</label>
                  <select 
                    className="form-select" 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Cooked Meal">Cooked Meal</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                    <option value="Packaged Food">Packaged Food</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 40 plates, 15 kg"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Expiry Date & Time *</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Pickup Location Address *</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Address where the food can be collected..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Storage / Dietary Notes</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Vegetarian, keep refrigerated, contains nuts..."
                />
              </div>

              <button type="submit" className="btn-form" style={{ marginTop: '0.5rem' }}>
                {editDonationId ? 'Save Changes' : 'List Surplus Food'}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Updating database workspace...</p>
        </div>
      ) : (
        <>
          {/* VIEW 1: OVERVIEW PAGE */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Metrics Row */}
              <div className="stats-grid">
                <div className="metric-card">
                  <div className="metric-details">
                    <p>Total Listings</p>
                    <h3>{stats.total}</h3>
                  </div>
                  <div className="metric-icon"><Gift size={20} /></div>
                </div>
                <div className="metric-card">
                  <div className="metric-details">
                    <p>Active Listings</p>
                    <h3>{stats.active}</h3>
                  </div>
                  <div className="metric-icon"><Clock size={20} /></div>
                </div>
                <div className="metric-card">
                  <div className="metric-details">
                    <p>Meals Delivered</p>
                    <h3>{stats.completed}</h3>
                  </div>
                  <div className="metric-icon"><CheckCircle size={20} /></div>
                </div>
              </div>

              <div className="dashboard-grid">
                {/* NGO Requests Inbox */}
                <div className="content-card">
                  <div className="content-card-header">
                    <h3>NGO Food Requests Inbox</h3>
                  </div>

                  {requests.filter(r => r.status === 'Pending').length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <p style={{ fontSize: '0.9rem' }}>No pending requests from NGOs at this moment.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {requests.filter(r => r.status === 'Pending').map((req) => (
                        <div 
                          key={req._id} 
                          style={{ 
                            border: '1px solid var(--border)', 
                            borderRadius: 'var(--radius-md)', 
                            padding: '1rem',
                            backgroundColor: 'var(--bg-landing)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <h4 style={{ fontSize: '0.95rem' }}>{req.donationDetails?.foodName}</h4>
                            <span className="badge badge-pending">Pending</span>
                          </div>
                          
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                            Requested by: <strong>{req.ngoName}</strong>
                          </div>
                          
                          {req.message && (
                            <p style={{ fontSize: '0.8rem', backgroundColor: 'white', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                              "{req.message}"
                            </p>
                          )}

                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              className="btn-card-action"
                              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', padding: '0.4rem 0.5rem', fontSize: '0.8rem', backgroundColor: 'var(--primary)' }}
                              onClick={() => handleRequestApproval(req._id, true)}
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button 
                              className="btn-card-action"
                              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', padding: '0.4rem 0.5rem', fontSize: '0.8rem', backgroundColor: 'var(--status-fail-txt)' }}
                              onClick={() => handleRequestApproval(req._id, false)}
                            >
                              <X size={14} /> Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dashboard Directory Guidelines */}
                <div className="content-card">
                  <div className="content-card-header">
                    <h3>Quick Shortcuts</h3>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Select a section below to update listings or coordinates.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="preview-item" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/donor/donations')}>
                      <div>
                        <h4 style={{ color: 'var(--primary)' }}>My Donations</h4>
                        <p style={{ fontSize: '0.75rem' }}>List food and view listings ({stats.total})</p>
                      </div>
                      <ArrowRight size={16} />
                    </div>
                    <div className="preview-item" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/donor/pickups')}>
                      <div>
                        <h4 style={{ color: 'var(--primary)' }}>Pickup Trackers</h4>
                        <p style={{ fontSize: '0.75rem' }}>Check scheduled collection runs</p>
                      </div>
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: MY DONATIONS TABLE */}
          {activeTab === 'donations' && (
            <div className="content-card">
              <div className="content-card-header">
                <h3>My Listed Donations</h3>
              </div>

              {donations.length === 0 ? (
                <div className="empty-state">
                  <Gift className="empty-state-icon" />
                  <h4>No Food Listed Yet</h4>
                  <p>When you list surplus food, it will display here for nearby NGOs to view and request.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Food Name</th>
                        <th>Category</th>
                        <th>Quantity</th>
                        <th>Expiry</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donations.map((don) => (
                        <tr key={don._id}>
                          <td style={{ fontWeight: 600 }}>{don.foodName}</td>
                          <td>{don.category}</td>
                          <td>{don.quantity}</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {new Date(don.expiryDate).toLocaleDateString()} at {new Date(don.expiryDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td>{getStatusBadge(don.status)}</td>
                          <td>
                            <div className="btn-action-group">
                              {['Available', 'Requested'].includes(don.status) && (
                                <button className="btn-icon-action" title="Edit" onClick={() => handleEditClick(don)}>
                                  <Edit2 size={14} />
                                </button>
                              )}
                              <button className="btn-icon-action danger" title="Delete" onClick={() => handleDelete(don._id)}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: SCHEDULED PICKUPS TABLE */}
          {activeTab === 'pickups' && (
            <div className="content-card">
              <div className="content-card-header">
                <h3>Scheduled Pickups & Delivery Tracking</h3>
              </div>

              {pickups.length === 0 ? (
                <div className="empty-state">
                  <Truck className="empty-state-icon" />
                  <h4>No Active Pickups</h4>
                  <p>When an NGO schedules a pickup for approved requests, it will display here with delivery status flows.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Food Item</th>
                        <th>Date & Time</th>
                        <th>Pickup Address</th>
                        <th>Status Flow</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pickups.map((pick) => (
                        <tr key={pick._id}>
                          <td style={{ fontWeight: 600 }}>{pick.donationDetails?.foodName || 'Food Item'}</td>
                          <td style={{ fontSize: '0.8rem' }}>
                            {pick.status === 'Pending' ? (
                              <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Awaiting schedule</span>
                            ) : (
                              `${pick.pickupDate} at ${pick.pickupTime}`
                            )}
                          </td>
                          <td style={{ maxWidth: '200px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {pick.pickupAddress}
                          </td>
                          <td>
                            <span className={`badge badge-${pick.status.replace(' ', '').toLowerCase()}`}>
                              {pick.status}
                            </span>
                          </td>
                          <td>
                            {pick.status === 'Scheduled' && (
                              <button 
                                className="btn-card-action" 
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                                onClick={() => handlePickupStatus(pick._id, 'Picked Up')}
                              >
                                Mark Picked Up
                              </button>
                            )}
                            {pick.status === 'Picked Up' && (
                              <button 
                                className="btn-card-action"
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', backgroundColor: 'var(--status-avail-txt)' }}
                                onClick={() => handlePickupStatus(pick._id, 'Delivered')}
                              >
                                Confirm Delivered
                              </button>
                            )}
                            {pick.status === 'Delivered' && (
                              <span style={{ color: 'var(--status-avail-txt)', fontSize: '0.8rem', fontWeight: 600 }}>
                                Delivered ✓
                              </span>
                            )}
                            {pick.status === 'Pending' && (
                              <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>
                                NGO Scheduling...
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DonorDashboard;
