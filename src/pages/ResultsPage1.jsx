import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaChartBar,
  FaListUl,
  FaDownload,
  FaHome,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBandAid
} from 'react-icons/fa';
import './css/ResultsPage.css';

import {
  calculateWeightedResults,
  getTargetCategory
} from './SelfAssessment';

import {
  CONDITION_DESCRIPTIONS
} from './MedicalConditions';

const DISPLAY_THRESHOLDS = {
  'INFLAMMATORY': 25,
  'INFECTIOUS': 20,
  'AUTOIMMUNE': 30,
  'BENIGN_GROWTH': 15,
  'PIGMENTARY': 25,
  'SKIN_CANCER': 10,
  'ENVIRONMENTAL': 20,
  'DEFAULT': 25
};

function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const predictions = location.state?.predictions;
  const capturedImage = location.state?.capturedImage;
  const assessmentData = location.state?.answers;
  const diseaseScores = location.state?.diseaseScores;
  const isAdaptive = location.state?.adaptive || false;

  if (!predictions || !capturedImage) {
    return (
      <div className="results-container">
        <div className="results-content">
          <div className="error-state">
            <FaExclamationTriangle className="error-icon" />
            <h2>Error</h2>
            <p>No analysis results available.</p>
            <button className="action-btn secondary-btn" onClick={() => navigate('/')}>
              <FaHome /> Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sortedPredictionsRaw = Object.entries(predictions.predictions)
    .map(([condition, probability]) => {
      const desc = CONDITION_DESCRIPTIONS[condition] || {};
      return {
        condition,
        probability,
        name: desc.name || condition,
        description: desc.description,
        description1: desc.description1,
        treatment: desc.treatment || "Unknown",
        recommendations: desc.recommendations || [],
        severity: desc.severity || "Unknown"
      };
    })
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 1);

  const topPrediction = sortedPredictionsRaw[0];
  const urgencyLevel =
    topPrediction.probability > 0.7 && (topPrediction.condition === 'MEL' || topPrediction.condition === 'SCC')
      ? 'high'
      : topPrediction.probability > 0.5
        ? 'moderate'
        : 'low';

  const handleDownloadReport = () => {
    const reportContent = `
      <html>
        <head>
          <title>Skin Analysis Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 2rem; }
            .section { margin-bottom: 2rem; }
            .condition { margin-bottom: 1rem; background: #f5f5f5; padding: 1rem; }
            .urgency.high { color: red; }
            .urgency.moderate { color: orange; }
            .urgency.low { color: green; }
            .note { font-style: italic; color: #666; margin-top: 10px; }
          </style>
        </head>
        <body>
          <h1>Skin Analysis Report</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <img src="${capturedImage}" alt="Skin" width="300"/>
          <div class="urgency ${urgencyLevel}">Urgency: ${urgencyLevel.toUpperCase()}</div>
          <div class="note">
            Note: Conditions are filtered by category-specific display thresholds.
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([reportContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skin-analysis-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getAllCategoriesResults = () => {
    const results = [];
    
    if (isAdaptive && diseaseScores && Object.keys(diseaseScores).length > 0) {
      const targetCategory = getTargetCategory(topPrediction.condition);
      const categoryData = diseaseScores;
      const categoryThreshold = DISPLAY_THRESHOLDS[targetCategory] || DISPLAY_THRESHOLDS.DEFAULT;
      
      if (Object.keys(categoryData).length > 0) {
        const top4 = Object.entries(categoryData)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4);

        const totalScore = top4.reduce((sum, [, score]) => sum + score, 0);
        
        const normalizedResults = top4
          .map(([disease, score]) => {
            const percentage = totalScore > 0 ? (score / totalScore) * 100 : 0;
            return {
              disease,
              percentage: Number(percentage.toFixed(1)),
              category: targetCategory,
              threshold: categoryThreshold
            };
          })
          .filter(result => result.percentage >= categoryThreshold);

        results.push(...normalizedResults);
      }
    } else if (assessmentData) {
      const categories = ['INFLAMMATORY', 'INFECTIOUS', 'AUTOIMMUNE', 'BENIGN_GROWTH', 'PIGMENTARY', 'SKIN_CANCER', 'ENVIRONMENTAL'];
      
      categories.forEach(category => {
        const weightedCategories = calculateWeightedResults(assessmentData, topPrediction.condition);
        const categoryData = weightedCategories[category];
        const categoryThreshold = DISPLAY_THRESHOLDS[category] || DISPLAY_THRESHOLDS.DEFAULT;
        
        if (categoryData && Object.keys(categoryData).length > 0) {
          const top4 = Object.entries(categoryData)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4);

          const totalScore = top4.reduce((sum, [, score]) => sum + score, 0);
          
          const normalizedResults = top4
            .map(([disease, score]) => {
              const percentage = totalScore > 0 ? (score / totalScore) * 100 : 0;
              return {
                disease,
                percentage: Number(percentage.toFixed(1)),
                category: category,
                threshold: categoryThreshold
              };
            })
            .filter(result => result.percentage >= categoryThreshold);

          results.push(...normalizedResults);
        }
      });
    }

    return results.sort((a, b) => b.percentage - a.percentage);
  };

  const allDiseaseResults = getAllCategoriesResults();

  return (
    <div className="results-container">
      <div className="results-content">
        <div className="results-header">
          <h1>Analysis Results</h1>
          <p>AI-Powered Skin Condition Analysis</p>
        </div>

        <div className="results-layout">
          {/* LEFT - Conditions */}
          <div className="result-section conditions-section">
            <h2 className="section-title"><FaChartBar /> Detected Conditions</h2>
            <div className={`urgency-indicator ${urgencyLevel}`}>
              {urgencyLevel !== 'low' ? <FaExclamationTriangle /> : <FaCheckCircle />}
              {urgencyLevel === 'high'
                ? 'Urgent medical attention recommended'
                : urgencyLevel === 'moderate'
                ? 'Medical consultation is advised'
                : 'Regular monitoring recommended'}
            </div>
            
            {allDiseaseResults.length > 0 ? (
              <>
                {allDiseaseResults.map((result, index) => {
                  const key = result.disease.replace(/_/g, ' ');
                  const info = CONDITION_DESCRIPTIONS[key];

                  return (
                    <div key={index} className="condition-card">
                      <div className="condition-header">
                        <h3 className='section-title'>{info?.name || key}</h3>
                      </div>
                      <p className='description'>{info?.description || "No description available."}</p>
                      <p className='condition-probability'>
                        Probability: {result.percentage}%
                      </p>
                      <p className='severity'>Severity: {info?.severity || "Unknown"}</p>
                    </div>
                    
                  );
                })}
              </>
            ) : (
              <div className="condition-card">
                <h3 className='section-title'>No High-Probability Conditions Detected</h3>
                <p className='description'>
                  No skin conditions met the category-specific display thresholds. 
                  This could indicate a benign condition or that further professional evaluation is needed.
                </p>
                <p className='condition-probability'>
                  Top detected condition: {topPrediction.name} ({(topPrediction.probability * 100).toFixed(1)}%)
                </p>
              </div>
            )}
          </div>

          {/* RIGHT - Recommendations & Image */}
          <div className="right-column">
            <div className="result-section">
              <h2 className="section-title"><FaListUl /> Recommendations</h2>
              <div className="recommendations-list">
                {topPrediction.recommendations.map((rec, index) => (
                  <div key={index} className="recommendation-item">
                    <FaCheckCircle className="recommendation-icon" />
                    {typeof rec === "string" ? (
                      <span>{rec}</span>
                    ) : (
                      <span>
                        <a href={rec.link} target="_blank" rel="noopener noreferrer" style={{ color: "white", textDecoration: "underline" }}>
                          {rec.text}
                        </a>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="result-section">
              <h2 className="section-title"><FaBandAid /> Analyzed Image</h2>
              <div className="analyzed-image">
                <img src={capturedImage} alt="Analyzed skin condition" />
              </div>
            </div>
          </div>
        </div>

        <div className="results-actions">
          <button className="action-btn primary-btn" onClick={handleDownloadReport}>
            <FaDownload /> Download Report
          </button>
          <button className="action-btn secondary-btn" onClick={() => navigate('/')}>
            <FaHome /> Return Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;