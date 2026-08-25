import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  Gift, ClipboardList, MapPin, Search, Filter, MessageSquare, 
  Calendar, Clock, CheckCircle, AlertCircle, Send, Truck, ArrowLeft, ArrowRight
} from 'lucide-react';

const NgoDashboard = () => {
  const { token, user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [availableFood, setAvailableFood] = useState([]);
  const [requests, setRequests] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [stats, setStats] = useState({ available: 0, pending: 0, completed: 0 });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Request Modal State
  const [requestFoodItem, setRequestFoodItem] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');

  // Schedule Pickup State
  const [schedulePickupItem, setSchedulePickupItem] = useState(null);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');

  // Derive active tab from URL path
  let activeTab = 'overview';
  const path = location.pathname;
  if (path.endsWith('/available')) activeTab = 'available';
  else if (path.endsWith('/requests')) activeTab = 'requests';
  else if (path.endsWith('/pickups')) activeTab = 'pickups';

  // Fetch Dashboard Data
  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      // Fetch available donations
      const foodRes = await fetch('/api/donations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const foodData = await foodRes.json();

      // Fetch my requests
      const reqRes = await fetch('/api/requests/my-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const reqData = await reqRes.json();

      // Fetch pickups
      const pickRes = await fetch('/api/pickups', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const pickData = await pickRes.json();

      if (foodRes.ok) {
        const activeFood = foodData.filter(d => ['Available', 'Requested'].includes(d.status));
        setAvailableFood(activeFood);
      }
      if (reqRes.ok) setRequests(reqData);
      if (pickRes.ok) setPickups(pickData);

      // Compute stats
      if (foodRes.ok && reqRes.ok) {
        const available = foodData.filter(d => d.status === 'Available').length;
        const pending = reqData.filter(r => r.status === 'Pending').length;
        const completed = reqData.filter(r => r.status === 'Completed').length;
        setStats({ available, pending, completed });
      }
    } catch (err) {
      console.error('Error fetching NGO dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Handle Submit Request
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestFoodItem) return;

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          donationId: requestFoodItem._id,
          message: requestMessage
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Request failed');
      }

      setMessage(`Request submitted for "${requestFoodItem.foodName}" successfully!`);
      setRequestFoodItem(null);
      setRequestMessage('');
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle Schedule Pickup
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!schedulePickupItem) return;

    try {
      const res = await fetch(`/api/pickups/${schedulePickupItem._id}/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pickupDate,
          pickupTime,
          pickupAddress: pickupAddress || schedulePickupItem.pickupAddress
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Scheduling failed');
      }

      setMessage('Pickup scheduled successfully!');
      setSchedulePickupItem(null);
      setPickupDate('');
      setPickupTime('');
      setPickupAddress('');
      fetchData();
    } catch (err) {
      setError(err.message);
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

  const filteredFood = availableFood.filter(food => {
    const matchesSearch = food.foodName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          food.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          food.donorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? food.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <span className="badge badge-pending">Pending</span>;
      case 'Approved': return <span className="badge badge-available">Approved</span>;
      case 'Rejected': return <span className="badge badge-rejected">Rejected</span>;
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
              <h2>NGO Workspace</h2>
              <p>Coordinate food rescues, review requests status, and schedule collections.</p>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <Link to="/dashboard/ngo" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                <ArrowLeft size={14} /> Back to Overview
              </Link>
              <h2 style={{ textTransform: 'capitalize' }}>
                {activeTab === 'available' ? 'Available Food Surplus' : activeTab === 'requests' ? 'My Food Requests' : 'Coordinate Pickups'}
              </h2>
            </div>
          )}
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Request Modal */}
      {requestFoodItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setRequestFoodItem(null)}>✕</button>
            <div className="modal-header">
              <h3>Request Food Donation</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Listing: <strong>{requestFoodItem.foodName}</strong> ({requestFoodItem.quantity})
              </p>
            </div>

            <form onSubmit={handleRequestSubmit}>
              <div className="form-group">
                <label>Add a Message for the Donor</label>
                <textarea
                  className="form-textarea"
                  rows="4"
                  placeholder="e.g. We will distribute this to the shelter nearby tonight..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-form">
                Submit Request <Send size={16} style={{ marginLeft: '0.5rem', display: 'inline' }} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Pickup Modal */}
      {schedulePickupItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setSchedulePickupItem(null)}>✕</button>
            <div className="modal-header">
              <h3>Schedule Food Pickup</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Food Item: <strong>{schedulePickupItem.donationDetails?.foodName}</strong>
              </p>
            </div>

            <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Pickup Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Pickup Time *</label>
                <input
                  type="time"
                  className="form-input"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Pickup Address (Defaults to Donor Location)</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder={schedulePickupItem.pickupAddress}
                />
              </div>

              <button type="submit" className="btn-form">
                Confirm Pickup Schedule
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Loading NGO dashboard...</p>
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
                    <p>Available Listings</p>
                    <h3>{stats.available}</h3>
                  </div>
                  <div className="metric-icon"><Gift size={20} /></div>
                </div>
                <div className="metric-card">
                  <div className="metric-details">
                    <p>Pending Requests</p>
                    <h3>{stats.pending}</h3>
                  </div>
                  <div className="metric-icon"><ClipboardList size={20} /></div>
                </div>
                <div className="metric-card">
                  <div className="metric-details">
                    <p>Completed Deliveries</p>
                    <h3>{stats.completed}</h3>
                  </div>
                  <div className="metric-icon"><CheckCircle size={20} /></div>
                </div>
              </div>

              {/* Navigation Guidelines */}
              <div className="dashboard-grid">
                <div className="content-card">
                  <div className="content-card-header">
                    <h3>NGO Control Directories</h3>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Select a section below to browse surplus foods or coordinate pickups.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div className="preview-item" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/ngo/available')}>
                      <div>
                        <h4 style={{ color: 'var(--primary)' }}>Available Food</h4>
                        <p style={{ fontSize: '0.75rem' }}>Browse food listings ({stats.available})</p>
                      </div>
                      <ArrowRight size={16} />
                    </div>
                    <div className="preview-item" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/ngo/requests')}>
                      <div>
                        <h4 style={{ color: 'var(--primary)' }}>My Requests</h4>
                        <p style={{ fontSize: '0.75rem' }}>Review submitted requests log ({stats.pending} pending)</p>
                      </div>
                      <ArrowRight size={16} />
                    </div>
                    <div className="preview-item" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/ngo/pickups')}>
                      <div>
                        <h4 style={{ color: 'var(--primary)' }}>Pickup Schedule</h4>
                        <p style={{ fontSize: '0.75rem' }}>Set times and track delivery runs</p>
                      </div>
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </div>

                <div className="content-card">
                  <div className="content-card-header">
                    <h3>Recent Notifications</h3>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Check your top notification bell on the navigation bar to see real-time updates from donors regarding your requests and pickups.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: AVAILABLE FOOD GALLERY */}
          {activeTab === 'available' && (
            <div className="content-card">
              <div className="content-card-header">
                <h3>Available Food Surplus Listings</h3>
              </div>

              {/* Filters bar */}
              <div className="filter-bar">
                <div className="filter-search" style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search by food name, donor, description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                </div>

                <div className="filter-select">
                  <select
                    className="form-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    <option value="Cooked Meal">Cooked Meal</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                    <option value="Packaged Food">Packaged Food</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {filteredFood.length === 0 ? (
                <div className="empty-state">
                  <Gift className="empty-state-icon" />
                  <h4>No Food Matches Found</h4>
                  <p>Check back later or try adjusting search terms to discover surplus listings.</p>
                </div>
              ) : (
                <div className="food-gallery">
                  {filteredFood.map((food) => (
                    <div key={food._id} className="food-card">
                      <div className="food-card-header">
                        <h4>{food.foodName}</h4>
                        <span className="badge badge-available" style={{ fontSize: '0.65rem' }}>{food.category}</span>
                      </div>
                      
                      <div className="food-card-body">
                        {food.description && <p className="food-card-desc">"{food.description}"</p>}
                        
                        <div className="food-details">
                          <div className="food-detail-item">
                            <span style={{ fontWeight: 600 }}>Quantity:</span> {food.quantity}
                          </div>
                          <div className="food-detail-item">
                            <MapPin size={14} style={{ color: 'var(--text-light)' }} />
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }}>{food.pickupAddress}</span>
                          </div>
                          <div className="food-detail-item">
                            <Clock size={14} style={{ color: 'var(--text-light)' }} />
                            <span>Expires: {new Date(food.expiryDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="food-card-footer">
                        <div className="food-donor-info">
                          <h5>Donor: {food.donorName}</h5>
                          <p>Status: {food.status}</p>
                        </div>
                        {food.status === 'Available' ? (
                          <button className="btn-card-action" onClick={() => setRequestFoodItem(food)}>
                            Request Food
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontStyle: 'italic' }}>Requested</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: REQUESTS HISTORY */}
          {activeTab === 'requests' && (
            <div className="content-card">
              <div className="content-card-header">
                <h3>My Requested History</h3>
              </div>

              {requests.length === 0 ? (
                <div className="empty-state">
                  <ClipboardList className="empty-state-icon" />
                  <h4>No Request History</h4>
                  <p>You have not requested any food listings yet. Go to "Available Food" to browse listings.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                  {requests.map((req) => (
                    <div 
                      key={req._id} 
                      style={{ 
                        border: '1px solid var(--border)', 
                        borderRadius: 'var(--radius-md)', 
                        padding: '1.25rem',
                        backgroundColor: 'white',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                        <h4 style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{req.donationDetails?.foodName || 'Deleted Listing'}</h4>
                        {getStatusBadge(req.status)}
                      </div>
                      
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                        Category: {req.donationDetails?.category} · Quantity: {req.donationDetails?.quantity}
                      </div>

                      {req.message && (
                        <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-muted)', backgroundColor: 'var(--bg-landing)', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                          "{req.message}"
                        </p>
                      )}

                      <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '0.75rem', textAlign: 'right' }}>
                        Requested: {new Date(req.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW 4: PICKUP SCHEDULES */}
          {activeTab === 'pickups' && (
            <div className="content-card">
              <div className="content-card-header">
                <h3>My Pickup Schedules</h3>
              </div>

              {pickups.length === 0 ? (
                <div className="empty-state">
                  <Truck className="empty-state-icon" />
                  <h4>No Scheduled Pickups</h4>
                  <p>When your requests are approved, they will appear here to arrange pickup coordinates.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Food Item</th>
                        <th>Donor</th>
                        <th>Schedule</th>
                        <th>Status Flow</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pickups.map((pick) => (
                        <tr key={pick._id}>
                          <td style={{ fontWeight: 600 }}>{pick.donationDetails?.foodName || 'Food Item'}</td>
                          <td>{pick.donationDetails?.donorName || 'Donor'}</td>
                          <td>
                            {pick.status === 'Pending' ? (
                              <button 
                                className="btn-primary" 
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                                onClick={() => { setSchedulePickupItem(pick); setPickupAddress(pick.pickupAddress); }}
                              >
                                Set Schedule
                              </button>
                            ) : (
                              <div style={{ fontSize: '0.8rem' }}>
                                <strong>Date:</strong> {pick.pickupDate}<br/>
                                <strong>Time:</strong> {pick.pickupTime}
                              </div>
                            )}
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
                                Mark Delivered
                              </button>
                            )}
                            {pick.status === 'Delivered' && (
                              <span style={{ color: 'var(--status-avail-txt)', fontSize: '0.8rem', fontWeight: 600 }}>
                                Completed ✓
                              </span>
                            )}
                            {pick.status === 'Pending' && (
                              <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>
                                Awaiting Date/Time
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

export default NgoDashboard;
