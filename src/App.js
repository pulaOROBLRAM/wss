import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import HowToUse from './components/HowToUse';
import Footer from './components/Footer';
import DermatologyFinder from './components/DermatologyFinder';
import './App.css';

function App() {
  const [isFinderOpen, setIsFinderOpen] = useState(false);

  function openFinder() {
    setIsFinderOpen(true);
    // Optionally scroll to view
    setTimeout(() => {
      const el = document.getElementById('dermatology-finder');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  }

  function closeFinder() {
    setIsFinderOpen(false);
  }

  // Allow opening finder via URL (?openFinder=1)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('openFinder') === '1') {
        openFinder();
      }
    } catch (_) {
      // ignore
    }
  }, []);
  return (
    <div className="App">
      <Header />
      <main>
        <Hero onStartFinder={openFinder} />
        <Features />
        <HowToUse />
        {isFinderOpen && (
          <DermatologyFinder onClose={closeFinder} />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;
