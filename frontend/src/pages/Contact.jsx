import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, Leaf } from 'lucide-react';

const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const triggerConfetti = () => {
    // Wait for the DOM element to mount
    setTimeout(() => {
      const container = document.getElementById('confetti-container');
      if (!container) return;
      
      const colors = ['#15803d', '#4ade80', '#60a5fa', '#f87171', '#fbbf24', '#c084fc'];
      
      for (let i = 0; i < 70; i++) {
        const p = document.createElement('div');
        p.className = 'confetti-piece';
        p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        p.style.left = Math.random() * 100 + '%';
        p.style.top = '-10px';
        p.style.width = Math.random() * 6 + 6 + 'px';
        p.style.height = Math.random() * 10 + 6 + 'px';
        p.style.transform = `rotate(${Math.random() * 360}deg)`;
        p.style.animation = `confetti-fall ${Math.random() * 1.8 + 1.2}s linear forwards`;
        container.appendChild(p);
        
        // Clean up
        setTimeout(() => {
          p.remove();
        }, 3000);
      }
    }, 50);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate sending message
    setTimeout(() => {
      setLoading(false);
      setIsSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      triggerConfetti();
    }, 1000);
  };

  return (
    <div className="contact-page-container">
      {/* Decorative background grid/blobs */}
      <div className="bg-blur-decorations">
        <div className="blur-blob blob-green"></div>
        <div className="blur-blob blob-mint"></div>
      </div>

      {/* 1. HERO SECTION */}
      <section className="contact-hero">
        <div className="badge-tag">
          <Leaf size={14} fill="currentColor" />
          Get In Touch
        </div>
        <h1 className="contact-title">
          We'd Love to <span>Hear From You.</span>
        </h1>
        <p className="contact-subtitle">
          Have questions about food donations, verifying your NGO, or general feedback? Send us a message and our team will get back to you shortly.
        </p>
      </section>

      {/* 2. MAIN SECTION GRID */}
      <section className="contact-main-section">
        <div className="contact-grid">
          {/* Left Column: Info Cards */}
          <div className="contact-info-column">
            <h2>Contact Information</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
              Feel free to reach out via phone or email, or drop by our operations office.
            </p>

            <div className="info-cards-list">
              <div className="info-card glass-panel hover-lift">
                <div className="info-icon-wrapper">
                  <Phone size={22} />
                </div>
                <div className="info-card-details">
                  <h4>Call Us</h4>
                  <p>+91 79 98765 4321</p>
                  <span>Mon-Sat · 9:00 AM to 7:00 PM</span>
                </div>
              </div>

              <div className="info-card glass-panel hover-lift">
                <div className="info-icon-wrapper">
                  <Mail size={22} />
                </div>
                <div className="info-card-details">
                  <h4>Email Support</h4>
                  <p>support@foodshare.org</p>
                  <span>We reply within 24 hours</span>
                </div>
              </div>

              <div className="info-card glass-panel hover-lift">
                <div className="info-icon-wrapper">
                  <MapPin size={22} />
                </div>
                <div className="info-card-details">
                  <h4>Main Office</h4>
                  <p>Ahmedabad, Gujarat, India</p>
                  <span>PIN - 380009</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="contact-form-column glass-panel">
            <div id="confetti-container" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}></div>
            
            {isSubmitted ? (
              <div className="contact-success-card">
                <CheckCircle size={56} className="success-icon" />
                <h3>Message Sent Successfully!</h3>
                <p>
                  Thank you for contacting FoodShare. We have received your inquiry and will respond to your registered email address as soon as possible.
                </p>
                <button className="btn-primary" onClick={() => setIsSubmitted(false)}>
                  Send another message
                </button>
              </div>
            ) : (
              <div className="contact-form-card">
                <h3>Send a Message</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  Fill out the form below and we will route your inquiry to the appropriate coordinator.
                </p>

                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-group">
                    <label htmlFor="contact-name">Full Name *</label>
                    <input
                      id="contact-name"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Ramesh Patel"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-email">Email Address *</label>
                    <input
                      id="contact-email"
                      type="email"
                      className="form-input"
                      placeholder="e.g. ramesh@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-subject">Subject *</label>
                    <input
                      id="contact-subject"
                      type="text"
                      className="form-input"
                      placeholder="e.g. NGO Verification Process"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-message">Message *</label>
                    <textarea
                      id="contact-message"
                      className="form-textarea"
                      rows="5"
                      placeholder="Write your detailed message here..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn-form" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
                    {loading ? 'Sending...' : (
                      <>
                        Send Message <Send size={16} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
