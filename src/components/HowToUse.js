import React from 'react';
import './HowToUse.css';

const steps = [
  {
    id: 1,
    title: 'Step 1',
    heading: 'Upload or take a pic of the affected skin area.',
    tip: 'Tip: Take picture in natural light, no flash, and make sure they’re clear and in focus.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1200&auto=format&fit=crop',
    nextLabel: 'Step 2 →'
  },
  {
    id: 2,
    title: 'Step 2',
    heading: 'Answer questions about the affected skin area for better care!',
    tip: '',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop',
    prevLabel: '← Step 1',
    nextLabel: 'Step 3 →'
  },
  {
    id: 3,
    title: 'Step 3',
    heading: 'Review the AI results and follow professional recommendations.',
    tip: '',
    image: 'https://images.unsplash.com/photo-1550831107-1553da8c8464?q=80&w=1200&auto=format&fit=crop',
    prevLabel: '← Step 2',
    cta: 'Start Now'
  }
];

const HowToUse = () => {
  return (
    <section className="how-to-use" id="how-to-use">
      <div className="how-to-use-container">
        <div className="how-to-use-header">
          <h2 className="how-to-use-title">How To Use</h2>
        </div>

        <div className="howto-steps">
          {steps.map((s, idx) => (
            <div key={s.id} className={`howto-card ${idx % 2 === 1 ? 'reverse' : ''}`}>
              <div className="howto-image">
                <img src={s.image} alt={s.title} />
              </div>
              <div className="howto-info">
                <div className="howto-title">{s.title}</div>
                <h3 className="howto-heading">{s.heading}</h3>
                {s.tip && <p className="howto-tip"><strong>Tip:</strong> {s.tip}</p>}
                <div className="howto-nav">
                  {s.prevLabel && <span className="howto-arrow left">{s.prevLabel}</span>}
                  {s.nextLabel && <span className="howto-arrow right">{s.nextLabel}</span>}
                </div>
                {s.cta && (
                  <button className="step-action-btn primary" style={{ marginTop: '1.25rem' }}>{s.cta}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowToUse;
