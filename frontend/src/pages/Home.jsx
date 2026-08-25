import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  ArrowRight, Leaf, ShieldAlert, Gift, ClipboardCheck, 
  Truck, Heart, HelpCircle, Users, ExternalLink, Mail, Phone, MapPin
} from 'lucide-react';

const Home = () => {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [dbStats, setDbStats] = useState({ donors: 3, ngos: 2, meals: 224 });
  const [liveListings, setLiveListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch metrics and preview listings from database
  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const statsRes = await fetch('/api/admin/stats');
        const donationsRes = await fetch('/api/donations');
        
        let stats = { donors: 3, ngos: 2, meals: 224 };
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          stats = {
            donors: statsData.totalDonors || 3,
            ngos: statsData.totalNGOs || 2,
            meals: statsData.mealsSaved || 224
          };
          setDbStats(stats);
        }

        if (donationsRes.ok) {
          const donationsData = await donationsRes.json();
          const sorted = donationsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);
          if (sorted.length > 0) {
            setLiveListings(sorted);
          } else {
            setLiveListings([
              { _id: '1', foodName: 'Veg Biryani (Buffet Surplus)', category: 'Cooked Meal', quantity: '40 plates', status: 'Available' },
              { _id: '2', foodName: 'Assorted Breads & Buns', category: 'Bakery', quantity: '60 pieces', status: 'Requested' },
              { _id: '3', foodName: 'Paneer Curry & Rotis', category: 'Cooked Meal', quantity: 'Serves 80', status: 'Reserved' },
              { _id: '4', foodName: 'Fresh Vegetables Crate', category: 'Fruits & Vegetables', quantity: '25 kg', status: 'Available' },
            ]);
          }
        }
      } catch (err) {
        console.error('Error fetching landing data:', err);
        setLiveListings([
          { _id: '1', foodName: 'Veg Biryani (Buffet Surplus)', category: 'Cooked Meal', quantity: '40 plates', status: 'Available' },
          { _id: '2', foodName: 'Assorted Breads & Buns', category: 'Bakery', quantity: '60 pieces', status: 'Requested' },
          { _id: '3', foodName: 'Paneer Curry & Rotis', category: 'Cooked Meal', quantity: 'Serves 80', status: 'Reserved' },
          { _id: '4', foodName: 'Fresh Vegetables Crate', category: 'Fruits & Vegetables', quantity: '25 kg', status: 'Available' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchLandingData();
  }, []);

  const handleDemoLogin = async (email, password) => {
    try {
      const loggedUser = await login(email, password);
      setShowDemoModal(false);
      navigate(`/dashboard/${loggedUser.role.toLowerCase()}`);
    } catch (err) {
      alert('Demo login failed: ' + err.message);
    }
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'available': return 'badge-available';
      case 'requested': return 'badge-requested';
      case 'reserved': return 'badge-reserved';
      case 'completed': return 'badge-completed';
      default: return '';
    }
  };

  return (
    <div className="landing-container">
      {/* 1. HERO SECTION */}
      <main className="landing-hero">
        <div className="hero-content">
          <div className="badge-tag">
            <Leaf size={14} fill="currentColor" />
            Food waste redistribution platform
          </div>
          
          <h1 className="hero-title">
            Good food deserves a plate, not a bin.
          </h1>
          
          <p className="hero-subtitle">
            FoodShare links surplus food from donors to nearby NGOs, and keeps every donation, request and pickup tracked end to end.
          </p>
          
          <div className="hero-actions">
            {user ? (
              <Link to={`/dashboard/${user.role.toLowerCase()}`} className="btn-primary">
                Go to Dashboard <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/auth" className="btn-primary">
                  Create an account <ArrowRight size={18} />
                </Link>
                <button className="btn-secondary" onClick={() => setShowDemoModal(true)}>
                  Try a demo account
                </button>
              </>
            )}
          </div>
          
          {/* Landing page statistics */}
          <div className="hero-stats">
            <div className="stat-box">
              <p className="stat-box-label">Donors</p>
              <h3 className="stat-box-value">{dbStats.donors}</h3>
            </div>
            <div className="stat-box">
              <p className="stat-box-label">NGO partners</p>
              <h3 className="stat-box-value">{dbStats.ngos}</h3>
            </div>
            <div className="stat-box">
              <p className="stat-box-label">Meals saved</p>
              <h3 className="stat-box-value">{dbStats.meals}</h3>
            </div>
          </div>
        </div>

        {/* Live listings preview panel */}
        <div className="preview-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: '700', marginBottom: '0.25rem' }}>Live listings preview</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time updates of surplus meals available in the area.</p>
          </div>
          
          <div className="preview-list">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                Loading live preview...
              </div>
            ) : (
              liveListings.map((listing) => (
                <div key={listing._id} className="preview-item">
                  <div className="preview-info">
                    <h4 style={{ fontWeight: 600 }}>{listing.foodName}</h4>
                    <p style={{ fontSize: '0.75rem' }}>{listing.category} · {listing.quantity}</p>
                  </div>
                  <span className={`badge ${getStatusClass(listing.status)}`}>
                    {listing.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* 2. PHOTO BANNER: PACKAGED FOODS */}
      <div style={{ width: '100%', height: '320px', overflow: 'hidden', position: 'relative', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <img 
          src="/food_packages.jpg" 
          alt="Fresh surplus packaged meals ready for distribution" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.95)' }}
        />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2rem', background: 'linear-gradient(transparent, rgba(0,0,0,0.75))', color: 'white' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h3 style={{ color: 'white', fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', fontWeight: 700 }}>Hygienic Surplus Handling</h3>
            <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>Meals are packed under hygienic guidelines by local banquets and bakeries, ready for volunteers.</p>
          </div>
        </div>
      </div>

      {/* 3. HOW IT WORKS SECTION */}
      <section className="home-section">
        <div className="home-section-title">
          <h2>How FoodShare Works</h2>
          <p>We provide an interactive tracking system to link and coordinate food surplus distribution in 3 easy steps.</p>
        </div>

        <div className="home-features-grid">
          <div className="feature-step-card">
            <div className="feature-step-number">1</div>
            <Gift size={28} color="var(--primary)" />
            <h3 style={{ fontSize: '1.15rem' }}>Donors List Surplus</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Hotels, caterers, bakeries, or households register and list leftover dishes, specifying quantity, location, and expiry times.
            </p>
          </div>

          <div className="feature-step-card">
            <div className="feature-step-number">2</div>
            <ClipboardCheck size={28} color="var(--primary)" />
            <h3 style={{ fontSize: '1.15rem' }}>NGOs Request Food</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Verified NGOs browse local listings, filter by categories, and send requests. The donor reviews and approves the request.
            </p>
          </div>

          <div className="feature-step-card">
            <div className="feature-step-number">3</div>
            <Truck size={28} color="var(--primary)" />
            <h3 style={{ fontSize: '1.15rem' }}>Tracked Delivery</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              NGOs schedule collection times. Both parties update the status flow (Pending → Scheduled → Picked Up → Delivered) in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* 4. OUR IMPACT & VOLUNTEERS PHOTO SECTION */}
      <section className="home-section-bg">
        <div className="home-about-grid">
          <div className="about-text">
            <div className="badge-tag" style={{ alignSelf: 'flex-start' }}>
              <Heart size={14} fill="currentColor" />
              Our Collective Mission
            </div>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.25rem', lineHeight: 1.2 }}>
              Connecting Kitchens to Communities.
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Thousands of tons of perfectly edible food go to waste daily from corporate buffets and commercial bakeries, while shelter homes and underprivileged families face food insecurity nearby.
            </p>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              FoodShare builds the digital bridge. By linking surplus kitchens directly to verified distribution NGOs and tracking every pickup logistics block, we minimize food wastage and maximize social impact.
            </p>
            <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
              <div>
                <strong style={{ fontSize: '1.5rem', color: 'var(--primary)', fontFamily: "'Outfit', sans-serif" }}>100%</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Hygienic Logistics</p>
              </div>
              <div>
                <strong style={{ fontSize: '1.5rem', color: 'var(--primary)', fontFamily: "'Outfit', sans-serif" }}>Real-time</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Status Alert Logs</p>
              </div>
            </div>
          </div>

          {/* Render NGO kitchen volunteers photo */}
          <div className="about-image-wrapper">
            <img 
              src="/ngo_kitchen.jpg" 
              className="about-image" 
              alt="NGO kitchen volunteers packing hot meals" 
            />
          </div>
        </div>
      </section>

      {/* 5. FEATURED PARTNERS SECTION */}
      <section className="home-section">
        <div className="home-section-title">
          <h2>Our Core Supporters</h2>
          <p>Local businesses donating meals and volunteers distributing hope on the ground.</p>
        </div>

        <div className="home-partners-grid">
          <div className="partner-logo-box">Metro Caterers</div>
          <div className="partner-logo-box">City Welfare trust</div>
          <div className="partner-logo-box">Central Wedding Lawn</div>
          <div className="partner-logo-box">Golden Harvest Farms</div>
          <div className="partner-logo-box">Robin Hood Volunteers</div>
        </div>
      </section>

      {/* 6. SLATE FOOTER SECTION */}
      <footer className="footer-container">
        <div className="footer-grid">
          <div className="footer-about">
            <h3>
              <Leaf size={22} fill="white" style={{ color: 'white' }} />
              FoodShare
            </h3>
            <p>
              A clean, modern platform designed to eliminate local food wastage by connecting surplus food donors with registered NGO distribution channels under real-time logistics tracking.
            </p>
          </div>
          
          <div className="footer-col">
            <h4>For Donors</h4>
            <ul className="footer-links">
              <li><Link to="/auth">List Food Surplus</Link></li>
              <li><Link to="/auth">Banquets & Caterers</Link></li>
              <li><Link to="/auth">Donor Guidelines</Link></li>
              <li><Link to="/auth">Seeding Demo Login</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>For NGOs</h4>
            <ul className="footer-links">
              <li><Link to="/auth">Browse Food Surplus</Link></li>
              <li><Link to="/auth">Register NGO</Link></li>
              <li><Link to="/auth">Pickup Schedules</Link></li>
              <li><Link to="/auth">Impact Reports</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Contact Info</h4>
            <ul className="footer-links" style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={16} /> Ahmedabad, Gujarat, India
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} /> +91 79 98765 4321
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} /> support@foodshare.org
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} FoodShare Platform. Built as a college project. All rights reserved.</p>
          <div className="footer-bottom-links">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#security">Security Core</a>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      {showDemoModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setShowDemoModal(false)}>✕</button>
            <div className="modal-header">
              <h3>Try a Demo Account</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Select a role below to log in instantly with pre-configured demo credentials.
              </p>
            </div>

            <div className="demo-account-grid">
              <div className="demo-role-card" onClick={() => handleDemoLogin('donor@foodshare.org', 'password123')}>
                <div className="demo-role-info">
                  <h4>Log in as Donor</h4>
                  <p>Create food listings, review NGO requests, and track pickups</p>
                </div>
                <ArrowRight size={18} color="var(--primary)" />
              </div>

              <div className="demo-role-card" onClick={() => handleDemoLogin('ngo@foodshare.org', 'password123')}>
                <div className="demo-role-info">
                  <h4>Log in as NGO</h4>
                  <p>Browse listings, submit requests, and schedule pickups</p>
                </div>
                <ArrowRight size={18} color="var(--primary)" />
              </div>

              <div className="demo-role-card" onClick={() => handleDemoLogin('admin@foodshare.org', 'password123')}>
                <div className="demo-role-info">
                  <h4>Log in as Administrator</h4>
                  <p>Manage users, donations, request logs, and platform statistics</p>
                </div>
                <ArrowRight size={18} color="var(--primary)" />
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', padding: '0.75rem', backgroundColor: '#fff8e1', border: '1px solid #ffe082', borderRadius: '8px', fontSize: '0.75rem', color: '#b78103', display: 'flex', gap: '0.5rem' }}>
              <ShieldAlert size={16} style={{ flexShrink: 0 }} />
              <span>Password for all demo accounts is <strong>password123</strong>. Custom accounts can also be created by registering.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
