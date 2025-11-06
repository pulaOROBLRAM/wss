import { useNavigate } from 'react-router-dom';
import './css/LandingPage.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faUpload, faClock, faListCheck, faUserMd, faFileLines } from '@fortawesome/free-solid-svg-icons';

function LandingPage() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/upload');
  };

  return (
    <div className="landing-container">
      <div className="landing-content">
        <div className="hero-section">
          <h1 className="title">Skin Disease Detection</h1>
          <p className="subtitle">AI-powered diagnosis</p>
        </div>

        <section className="about-section">
          <h2>About This App</h2>
          <div className="glass-card">
            <p>
              This web application allows users to scan and upload skin images to detect possible skin diseases using machine learning. It's designed for quick, accessible, and private self-screening.
            </p>
          </div>
        </section>

        <section className="guide-section">
          <h2>How to Use</h2>
          <div className="guide-steps">
            <div className="guide-step">
              <div className="icon-circle">
                <FontAwesomeIcon icon={faCamera} className="guide-icon" />
              </div>
              <p>Prepare a clear photo of the affected skin area.</p>
            </div>
            
            <div className="guide-step">
              <div className="icon-circle">
                <FontAwesomeIcon icon={faUpload} className="guide-icon" />
              </div>
              <p>Complete a brief assessment of your condition.</p>
            </div>

            <div className="guide-step">
              <div className="icon-circle">
                <FontAwesomeIcon icon={faListCheck} className="guide-icon" />
              </div>
              <p>Review and Verify your Query.</p>
            </div>
            
            <div className="guide-step">
              <div className="icon-circle">
                <FontAwesomeIcon icon={faClock} className="guide-icon" />
              </div>
              <p>Wait for the Model to analyze and return results.</p>
            </div>
            
            <div className="guide-step">
              <div className="icon-circle">
                <FontAwesomeIcon icon={faFileLines} className="guide-icon" />
              </div>
              <p>Read the result and suggested actions.</p>
            </div>

            <div className="guide-step">
              <div className="icon-circle">
                <FontAwesomeIcon icon={faUserMd} className="guide-icon" />
              </div>
              <p>Connect with certified dermatologists for professional advice.</p>
            </div>
          </div>
        </section>

        <div className="cta-section">
          <button 
            className="start-button"
            onClick={handleStart}
          >
            Start Assessment
          </button>
        </div>

        <footer className="footer">
          <p>&copy; 2025 SkinCheck AI. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default LandingPage;
