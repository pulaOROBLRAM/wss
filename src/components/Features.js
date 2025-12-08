import React from 'react';
import './Features.css';

const Features = () => {
  const features = [
    {
      icon: '📝',
      title: 'Proactive Care',
      description: 'Identify potential issues early and seek professional advice.',
      color: 'linear-gradient(135deg, #94a3b8, #cbd5e1)'
    },
    {
      icon: '🛡️',
      title: 'Privacy First',
      description: 'Our platform is HIPAA compliant. Your data stays private.',
      color: 'linear-gradient(135deg, #2563eb, #1d4ed8)'
    },
    {
      icon: '🧑‍⚕️',
      title: 'Expert Foundation',
      description: 'AI‑trained models to help with your skin health journey.',
      color: 'linear-gradient(135deg, #7c3aed, #6d28d9)'
    }
  ];

  return (
    <section className="features" id="about">
      <div className="features-container">
        <div className="features-header">
          <h2 className="features-title">Why Use This App?<br/>Your Skin Health Matters.</h2>
          <p className="features-subtitle">
            Our application harnesses the power of AI to quickly analyze images of your skin. By scanning and uploading a photo, you receive an instant assessment for potential signs of common skin conditions.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="feature-card"
              style={{ '--card-delay': `${index * 0.1}s` }}
            >
              <div className="feature-icon" style={{ background: feature.color }}>
                <span>{feature.icon}</span>
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <div className="feature-accent" style={{ background: feature.color }}></div>
            </div>
          ))}
        </div>

        {/* Stats removed to match the simplified three‑card design */}
      </div>
    </section>
  );
};

export default Features;
