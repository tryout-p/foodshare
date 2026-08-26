import React from 'react';
import { Leaf, Sprout, Handshake, ShieldCheck, Heart, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="about-page-container">
      {/* 1. HERO SECTION */}
      <section className="about-hero">
        <div className="badge-tag">
          <Leaf size={14} fill="currentColor" />
          About Food Share
        </div>
        <h1 className="about-title">
          Sharing Food, <span>Saving Lives.</span>
        </h1>
        <p className="about-subtitle">
          Food Share is a platform that connects food donors with NGOs and people in need.
          Our goal is to reduce food waste and make surplus food reach those who need it most.
        </p>
      </section>

      {/* 2. THREE PILLARS CARD GRID */}
      <section className="about-pillars-section">
        <div className="pillars-grid">
          <div className="pillar-card">
            <div className="pillar-icon-wrapper">
              <Heart size={28} className="pillar-icon" />
            </div>
            <h3>Our Mission</h3>
            <p>
              Our mission is to reduce food wastage by connecting restaurants, hotels, events, and individual donors directly with registered NGOs.
            </p>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon-wrapper">
              <Sprout size={28} className="pillar-icon" />
            </div>
            <h3>Our Vision</h3>
            <p>
              We imagine a future where no edible food is wasted and every surplus meal has an immediate path to families and communities experiencing food insecurity.
            </p>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon-wrapper">
              <Handshake size={28} className="pillar-icon" />
            </div>
            <h3>Our Community</h3>
            <p>
              Food Share brings donors and NGOs together to create a stronger, more connected local network that tracks every logistics block with full transparency.
            </p>
          </div>
        </div>
      </section>

      {/* 3. DETAILED VALUE PROP SECTION */}
      <section className="about-details-section">
        <div className="details-content-grid">
          <div className="details-text">
            <h2>Why FoodShare Matters</h2>
            <p>
              Every year, millions of tons of edible food go to waste from weddings, corporate banquets, and local eateries. At the same time, thousands of children and families struggle to secure their next meal.
            </p>
            <p>
              FoodShare solves this mismatch. We provide the technology that allows donors to register surplus meals in minutes, notifies nearby verified NGOs, and manages the pickup logistics transparently.
            </p>
            <div className="bullet-points">
              <div className="bullet-item">
                <ShieldCheck size={20} className="bullet-icon" />
                <span><strong>Verified NGO Partners:</strong> Every organization is vetted before accessing listings.</span>
              </div>
              <div className="bullet-item">
                <Award size={20} className="bullet-icon" />
                <span><strong>Zero Overhead:</strong> Seamless direct pickup matching minimizes transport delays.</span>
              </div>
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <Link to="/auth" state={{ mode: 'signup' }} className="btn-primary" style={{ display: 'inline-flex' }}>
                Join Us Today
              </Link>
            </div>
          </div>
          <div className="details-illustration">
            <div className="illustration-backdrop"></div>
            <div className="illustration-circle">
              <Sprout size={80} color="var(--primary)" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
