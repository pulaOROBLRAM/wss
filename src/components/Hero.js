import React from 'react';
import './Hero.css';

const Hero = ({ onStartFinder }) => {
  return (
    <section className="hero" id="home">
      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Empower Your Skin Health Journey.
              <span className="gradient-text"> Quick, Private Self–Screening.</span>
            </h1>
            <p className="hero-description">
              In today’s fast–paced world, monitoring your skin health can be challenging. This platform puts a powerful, accessible and completely private self–screening tool in your hands.
            </p>
            <div className="hero-actions">
              <button className="cta-primary" onClick={onStartFinder}>
                <span>Start Now</span>
                <svg className="arrow-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button className="cta-secondary">
                <svg className="play-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
                </svg>
                Watch Demo
              </button>
            </div>
            <div className="trust-indicators">
              <p className="trust-text">Trusted by leading healthcare professionals</p>
              <div className="trust-logos">
                <div className="trust-logo">🏥 Mayo Clinic</div>
                <div className="trust-logo">🔬 Johns Hopkins</div>
                <div className="trust-logo">⚕️ Cleveland Clinic</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="phone-mockup">
            <div className="phone-screen">
              <div className="scan-animation">
                <div className="scan-line"></div>
                <div className="scan-grid">
                  <div className="grid-line"></div>
                  <div className="grid-line"></div>
                  <div className="grid-line"></div>
                  <div className="grid-line"></div>
                </div>
              </div>
              <div className="analysis-results">
                <div className="result-item">
                  <div className="result-icon">✓</div>
                  <span>Analysis Complete</span>
                </div>
                <div className="result-item">
                  <div className="result-icon">📊</div>
                  <span>Confidence: 94%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="floating-elements">
            <div className="floating-card card-1">
              <div className="card-icon">🔍</div>
              <span>AI Analysis</span>
            </div>
            <div className="floating-card card-2">
              <div className="card-icon">🛡️</div>
              <span>Privacy First</span>
            </div>
            <div className="floating-card card-3">
              <div className="card-icon">⚡</div>
              <span>Instant Results</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="hero-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>
    </section>
  );
};

export default Hero;
