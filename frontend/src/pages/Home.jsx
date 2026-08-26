import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  ArrowRight, Leaf, ShieldAlert, Gift, ClipboardCheck, 
  Truck, Heart, HelpCircle, Users, ExternalLink, Mail, Phone, MapPin,
  Moon, Sun, Globe
} from 'lucide-react';

const Home = () => {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [dbStats, setDbStats] = useState({ donors: 3, ngos: 2, meals: 224 });
  const [displayStats, setDisplayStats] = useState({ donors: 0, ngos: 0, meals: 0 });
  const [liveListings, setLiveListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  // Interactive Calculator State
  const [surplusKg, setSurplusKg] = useState(30);
  
  // FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState(null);
  
  const faqData = [
    { q: "Is the donated food safe to consume?", a: "Yes. Donors must follow strict hygienic guidelines. Food must be packed hot or immediately refrigerated. Banquets and hotels specify prep and expiry timestamps so NGOs can distribute them within safe windows." },
    { q: "Who handles the transportation/pickup?", a: "Verified NGOs coordinate directly with the donor. Once a request is accepted, the NGO assigns a volunteer or vehicle team to pickup food from the donor's address at the scheduled window." },
    { q: "How are NGOs verified?", a: "Our administration verifies NGO registration certificates, tax status documents, and operating address records to prevent abuse and ensure food reaches real families." },
    { q: "Are there tax benefits for commercial donors?", a: "Yes, registered businesses and hotels receive tax-deductible receipts and impact certificate summaries directly from verified NGOs via our tracking reports." }
  ];

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

  // Stats Dynamic Count-up Animation
  useEffect(() => {
    if (loading) return;
    const duration = 1200; // 1.2 seconds
    const steps = 30;
    const intervalTime = duration / steps;
    
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setDisplayStats({
        donors: Math.min(Math.round((dbStats.donors / steps) * step), dbStats.donors),
        ngos: Math.min(Math.round((dbStats.ngos / steps) * step), dbStats.ngos),
        meals: Math.min(Math.round((dbStats.meals / steps) * step), dbStats.meals)
      });
      
      if (step >= steps) {
        clearInterval(timer);
      }
    }, intervalTime);
    
    return () => clearInterval(timer);
  }, [dbStats, loading]);

  // Theme sync effect
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

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
      {/* Decorative Floating Background Elements for enhanced moving UI */}
      <div className="floating-decorations">
        <div className="decor-item leaf-1"><Leaf size={24} color="var(--primary)" opacity={0.15} /></div>
        <div className="decor-item leaf-2"><Leaf size={16} color="var(--primary)" opacity={0.12} /></div>
        <div className="decor-item leaf-3"><Leaf size={20} color="var(--primary)" opacity={0.1} /></div>
        <div className="decor-item heart-1"><Heart size={16} color="#ef4444" opacity={0.1} /></div>
        <div className="decor-item gift-1"><Gift size={20} color="var(--primary)" opacity={0.08} /></div>
      </div>

      {/* 1. HERO SECTION */}
      <main className="landing-hero">
        <div className="hero-content">
          <div className="badge-tag">
            <Leaf size={14} fill="currentColor" />
            Together Against Food Waste
          </div>
          
          <h1 className="hero-title">
            Share Food. <br />
            <span>Spread Happiness.</span>
          </h1>
          
          <p className="hero-subtitle">
            Food Share connects people, restaurants, donors and NGOs to redistribute surplus food and make sure good food reaches someone who needs it.
          </p>
          
          <div className="hero-actions">
            {user ? (
              <Link to={`/dashboard/${user.role.toLowerCase()}`} className="btn-primary">
                Go to Dashboard <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/auth" state={{ mode: 'signup' }} className="btn-primary">
                  Start Sharing <Leaf size={18} />
                </Link>
                <Link to="/about" className="btn-secondary">
                  Learn More <ArrowRight size={18} />
                </Link>
              </>
            )}
          </div>
          
          {/* Landing page statistics with count-up animation */}
          <div className="hero-stats">
            <div className="stat-box hover-lift">
              <p className="stat-box-label">Donors</p>
              <h3 className="stat-box-value">{displayStats.donors}</h3>
            </div>
            <div className="stat-box hover-lift">
              <p className="stat-box-label">NGO partners</p>
              <h3 className="stat-box-value">{displayStats.ngos}</h3>
            </div>
            <div className="stat-box hover-lift">
              <p className="stat-box-label">Meals saved</p>
              <h3 className="stat-box-value">{displayStats.meals}</h3>
            </div>
          </div>
        </div>

        {/* Interactive Visual Image & Badge Layout instead of Listings Preview */}
        <div className="hero-interactive-visual">
          <div className="visual-backdrop-glow"></div>
          
          {/* Main Visual Image Card */}
          <div className="visual-image-card float-animation">
            <div className="food-box-icon">
              <svg width="70" height="70" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 20C18 14 26 8 34 11C40 13 38 22 38 22" fill="#86efac" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M36 20C34 13 44 9 48 14C51 18 44 24 44 24" fill="#86efac" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 26L30 14L34 18L22 30L16 26Z" fill="#fb923c" stroke="#ea580c" strokeWidth="2" strokeLinejoin="round" />
                <path d="M30 14C31.5 10.5 35 7.5 33 5C30 2.5 28 6.5 28 8.5" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 28H52L47 52H17L12 28Z" fill="#581c87" stroke="#3b0764" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M9 24H55V29H9V24Z" fill="#6b21a8" stroke="#3b0764" strokeWidth="2.5" strokeLinejoin="round" />
                <rect x="22" y="36" width="20" height="6" rx="3" fill="#a21caf" opacity="0.3" />
              </svg>
            </div>
            <h4>Fresh Food</h4>
            <p>Ready to be shared</p>
            <span className="visual-status-tag">
              <span className="dot"></span> Available Now
            </span>
          </div>

          {/* Floating badge 1: Top Right */}
          <div className="visual-badge-float float-badge-1">
            <div className="badge-icon-circle heart-bg">
              <Heart size={16} fill="currentColor" color="currentColor" />
            </div>
            <div className="badge-content-text">
              <h5>Food Saved</h5>
              <p>Every meal matters</p>
            </div>
          </div>

          {/* Floating badge 2: Bottom Left */}
          <div className="visual-badge-float float-badge-2">
            <div className="badge-icon-circle globe-bg">
              <Globe size={16} color="currentColor" />
            </div>
            <div className="badge-content-text">
              <h5>Make an Impact</h5>
              <p>Reduce food waste</p>
            </div>
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

      {/* 3. INTERACTIVE IMPACT CALCULATOR WIDGET */}
      <section className="home-section calculator-container">
        <div className="home-section-title">
          <h2>Food Surplus Impact Estimator</h2>
          <p>Drag the slider below to project the positive impact your kitchen can generate by redistributing surplus meals instead of discarding them.</p>
        </div>

        <div className="calculator-widget hover-lift">
          <div className="widget-slider-box">
            <div className="slider-header">
              <span>Your Daily Food Surplus:</span>
              <strong className="slider-value">{surplusKg} kg</strong>
            </div>
            <input 
              type="range"
              min="5"
              max="200"
              step="5"
              value={surplusKg}
              onChange={(e) => setSurplusKg(parseInt(e.target.value))}
              className="surplus-range-input"
            />
            <div className="slider-footer-labels">
              <span>5 kg (Cafe)</span>
              <span>200 kg (Banquet / Hotel)</span>
            </div>
          </div>

          <div className="widget-metrics-grid">
            <div className="metric-indicator-box">
              <span className="metric-indicator-emoji">🍽️</span>
              <h4>{Math.round(surplusKg * 2.2)}</h4>
              <p>Meals Saved / Day</p>
            </div>
            
            <div className="metric-indicator-box">
              <span className="metric-indicator-emoji">🌱</span>
              <h4>{(surplusKg * 2.5).toFixed(1)} kg</h4>
              <p>CO2 Saved / Day</p>
            </div>

            <div className="metric-indicator-box">
              <span className="metric-indicator-emoji">💧</span>
              <h4>{Math.round(surplusKg * 950).toLocaleString()} L</h4>
              <p>Water Saved / Day</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section className="home-section">
        <div className="home-section-title">
          <h2>How FoodShare Works</h2>
          <p>We provide an interactive tracking system to link and coordinate food surplus distribution in 3 easy steps.</p>
        </div>

        <div className="home-features-grid">
          <div className="feature-step-card hover-lift">
            <div className="feature-step-number">1</div>
            <Gift size={28} color="var(--primary)" />
            <h3 style={{ fontSize: '1.15rem' }}>Donors List Surplus</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Hotels, caterers, bakeries, or households register and list leftover dishes, specifying quantity, location, and expiry times.
            </p>
          </div>

          <div className="feature-step-card hover-lift">
            <div className="feature-step-number">2</div>
            <ClipboardCheck size={28} color="var(--primary)" />
            <h3 style={{ fontSize: '1.15rem' }}>NGOs Request Food</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Verified NGOs browse local listings, filter by categories, and send requests. The donor reviews and approves the request.
            </p>
          </div>

          <div className="feature-step-card hover-lift">
            <div className="feature-step-number">3</div>
            <Truck size={28} color="var(--primary)" />
            <h3 style={{ fontSize: '1.15rem' }}>Tracked Delivery</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              NGOs schedule collection times. Both parties update the status flow (Pending → Scheduled → Picked Up → Delivered) in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* 5. OUR IMPACT & VOLUNTEERS PHOTO SECTION */}
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

      {/* 6. FAQ ACCORDION SECTION */}
      <section className="home-section faq-accordion-container">
        <div className="home-section-title">
          <h2>Frequently Asked Questions</h2>
          <p>Find quick answers regarding food safety guidelines, verification, and logistics tracking.</p>
        </div>

        <div className="accordion-wrapper">
          {faqData.map((faq, index) => (
            <div 
              key={index} 
              className={`accordion-row ${activeFaq === index ? 'row-expanded' : ''}`}
              onClick={() => setActiveFaq(activeFaq === index ? null : index)}
            >
              <div className="accordion-trigger">
                <h3>{faq.q}</h3>
                <span className="accordion-icon-toggle">{activeFaq === index ? '−' : '+'}</span>
              </div>
              <div className="accordion-content">
                <p>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. FEATURED PARTNERS SECTION */}
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

      {/* 8. SLATE FOOTER SECTION */}
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
              <li><Link to="/auth" state={{ mode: 'signup' }}>Register NGO</Link></li>
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

      {/* Floating Theme Switcher Button */}
      <button className="theme-switcher-btn" onClick={toggleTheme} aria-label="Toggle Theme">
        {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
      </button>

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
