import React, { useEffect, useMemo, useState } from 'react';
import './HowToUse.css';

// Simple haversine distance in km
function calculateDistanceKm(a, b) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const c = 2 * Math.asin(
    Math.sqrt(
      sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon
    )
  );
  return R * c;
}

// Demo dataset; replace with API later
const DEMO_DERMATOLOGISTS = [
  { id: 'd1', name: 'ClearSkin Clinic', city: 'Austin, TX', lat: 30.2672, lng: -97.7431, domain: 'clearskin.example.com' },
  { id: 'd2', name: 'DermCare Center', city: 'Dallas, TX', lat: 32.7767, lng: -96.7970, domain: 'dermcare.example.com' },
  { id: 'd3', name: 'Glow Dermatology', city: 'San Antonio, TX', lat: 29.4241, lng: -98.4936, domain: 'glowderm.example.com' },
  { id: 'd4', name: 'Metro Derm Group', city: 'Houston, TX', lat: 29.7604, lng: -95.3698, domain: 'metroderm.example.com' },
  { id: 'd5', name: 'Summit Skin', city: 'Oklahoma City, OK', lat: 35.4676, lng: -97.5164, domain: 'summitskin.example.com' },
];

const ADAPTIVE_QUESTIONS = [
  {
    key: 'concern',
    question: 'What best describes your current skin concern?',
    type: 'choice',
    options: ['Rash', 'Acne', 'Mole/Spot', 'Eczema/Psoriasis', 'Other'],
  },
  {
    key: 'duration',
    question: 'How long have you had this concern?',
    type: 'choice',
    dependsOn: 'concern',
    optionsByAnswer: {
      Rash: ['< 48 hours', '2-7 days', '1-4 weeks', '1+ months'],
      Acne: ['< 1 month', '1-3 months', '3-12 months', '1+ years'],
      'Mole/Spot': ['Recently noticed', '6-12 months', '1-3 years', '3+ years'],
      'Eczema/Psoriasis': ['Flare-up now', 'Intermittent for months', 'Chronic > 1 year'],
      Other: ['Unsure', 'New', 'Ongoing'],
    },
  },
  {
    key: 'urgency',
    question: 'How urgent is your need to see a dermatologist?',
    type: 'choice',
    options: ['Today/Tomorrow', 'This week', 'Next 2 weeks', 'Flexible'],
  },
];

function DermatologyFinder({ onClose }) {
  const [userLocation, setUserLocation] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [dermatologists, setDermatologists] = useState(DEMO_DERMATOLOGISTS);
  const [specificDerm, setSpecificDerm] = useState(null);

  // Detect specific dermatologist context via URL (?dermId=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const dermId = params.get('dermId');
      if (dermId) {
        const found = DEMO_DERMATOLOGISTS.find((d) => d.id === dermId);
        if (found) setSpecificDerm(found);
      }
    } catch (_) {
      // ignore
    }
  }, []);

  // Geolocate user when no specific derm is provided
  useEffect(() => {
    if (specificDerm) return;
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        setGeoError(err.message || 'Unable to fetch location');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 600000 }
    );
  }, [specificDerm]);

  const sortedByDistance = useMemo(() => {
    if (!userLocation) return dermatologists.map((d) => ({ ...d, distanceKm: null }));
    return dermatologists
      .map((d) => ({ ...d, distanceKm: calculateDistanceKm(userLocation, { lat: d.lat, lng: d.lng }) }))
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }, [dermatologists, userLocation]);

  function handleAnswerChange(key, value) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function getOptionsForQuestion(q) {
    if (q.options) return q.options;
    if (q.optionsByAnswer && q.dependsOn && answers[q.dependsOn]) {
      const opts = q.optionsByAnswer[answers[q.dependsOn]];
      return Array.isArray(opts) ? opts : [];
    }
    return [];
  }

  function handleTrackClick(derm) {
    const key = 'dermatologistClicks';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const entry = { dermId: derm.id, name: derm.name, ts: Date.now() };
    const next = [entry, ...existing].slice(0, 100);
    localStorage.setItem(key, JSON.stringify(next));
  }

  function handleSeekNearby() {
    setGeoError(null);
    setUserLocation(null);
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setGeoError(err.message || 'Unable to fetch location'),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }

  const top3 = specificDerm ? [] : sortedByDistance.slice(0, 3);
  const others = specificDerm ? dermatologists : sortedByDistance.slice(3);

  return (
    <section className="how-to-use" id="dermatology-finder" style={{ paddingTop: '60px' }}>
      <div className="how-to-use-container">
        <div className="how-to-use-header">
          <h2 className="how-to-use-title">
            {specificDerm ? 'Book with your dermatologist' : 'Find a dermatologist near you'}
          </h2>
          <p className="how-to-use-subtitle">
            {specificDerm
              ? `You were referred by ${specificDerm.name}. Answer a few questions and book.`
              : 'Answer a few adaptive questions and choose a nearby dermatologist.'}
          </p>
        </div>

        <div className="steps-container">
          <div className="step-content" style={{ width: '100%' }}>
            <div className="step-info" style={{ width: '100%' }}>
              {ADAPTIVE_QUESTIONS.map((q) => (
                <div key={q.key} className="step-details" style={{ marginBottom: '16px' }}>
                  <h4 className="details-title" style={{ marginBottom: '8px' }}>{q.question}</h4>
                  <div className="details-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {getOptionsForQuestion(q).map((opt) => (
                      <button
                        key={opt}
                        className={`step-action-btn ${answers[q.key] === opt ? 'primary' : 'secondary'}`}
                        onClick={() => handleAnswerChange(q.key, opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="process-flow">
          {specificDerm ? (
            <div className="flow-steps">
              <div className="flow-step" style={{ alignItems: 'center' }}>
                <div className="flow-content">
                  <div className="flow-title-text" style={{ fontSize: '1.1rem' }}>
                    {specificDerm.name} — {specificDerm.city}
                  </div>
                </div>
                <div className="flow-arrow"></div>
                <a
                  href={`https://${specificDerm.domain}/book`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="step-action-btn primary"
                  onClick={() => handleTrackClick(specificDerm)}
                >
                  Book appointment
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="flow-title">Nearest top 3</div>
              {geoError && (
                <div className="flow-steps" style={{ color: '#ef4444', marginBottom: '8px' }}>{geoError}</div>
              )}
              <div className="flow-steps">
                {top3.map((d) => (
                  <div key={d.id} className="flow-step" style={{ alignItems: 'center' }}>
                    <div className="flow-content">
                      <div className="flow-title-text" style={{ fontSize: '1.1rem' }}>
                        {d.name} — {d.city} {typeof d.distanceKm === 'number' ? `• ${d.distanceKm.toFixed(1)} km` : ''}
                      </div>
                    </div>
                    <div className="flow-arrow"></div>
                    <a
                      href={`https://${d.domain}/book`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="step-action-btn primary"
                      onClick={() => handleTrackClick(d)}
                    >
                      Book
                    </a>
                  </div>
                ))}
              </div>

              <div className="flow-title" style={{ marginTop: '12px' }}>All other</div>
              <div className="flow-steps">
                {others.map((d) => (
                  <div key={d.id} className="flow-step" style={{ alignItems: 'center' }}>
                    <div className="flow-content">
                      <div className="flow-title-text">
                        {d.name} — {d.city}
                      </div>
                    </div>
                    <div className="flow-arrow"></div>
                    <a
                      href={`https://${d.domain}/book`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="step-action-btn secondary"
                      onClick={() => handleTrackClick(d)}
                    >
                      View site
                    </a>
                  </div>
                ))}
              </div>
            </>
          )}

          {!specificDerm && (
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="step-action-btn primary" onClick={handleSeekNearby}>
                Seek out dermatologists near you
              </button>
              <button className="step-action-btn secondary" onClick={onClose}>
                Close
              </button>
            </div>
          )}

          {specificDerm && (
            <div style={{ marginTop: '16px' }}>
              <button className="step-action-btn secondary" onClick={onClose}>Close</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default DermatologyFinder;



