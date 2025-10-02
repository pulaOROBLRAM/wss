import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import UploadPage from './pages/UploadPage';
import SelfAssessment from './pages/SelfAssessment';
import CameraPage from './pages/CameraPage';
import ReviewPage from './pages/ReviewPage';
import ResultsPage from './pages/ResultsPage';
import ResultsPage1 from './pages/ResultsPage1';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/assessment" element={<SelfAssessment />} />
          <Route path="/camera" element={<CameraPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/results" element={<ResultsPage1 />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
