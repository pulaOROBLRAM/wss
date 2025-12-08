import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-simple">
          <div className="footer-left">
            <div className="footer-logo">
              <span className="logo-icon">🔬</span>
              <span className="logo-text">SkinSight AI</span>
            </div>
            <p className="footer-tagline">Empower Your Skin Health Journey,</p>
            <p className="footer-tagline sub">Trusted skin health journey since 2025</p>
          </div>

          <nav className="footer-nav">
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#how-to-use">How To Use</a>
          </nav>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div></div>
            <p className="copyright">© 2025 SkinSight AI. All rights reserved.</p>
            <div></div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
