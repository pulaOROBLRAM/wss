import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaChartBar,
  FaListUl,
  FaDownload,
  FaHome,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBandAid,
  FaClipboardList,
  FaUser
} from 'react-icons/fa';
import './css/ResultsPage.css';

import {
  calculateWeightedResults,
  getTargetCategory
} from './SelfAssessment';

import {
  CONDITION_DESCRIPTIONS
} from './SelfAssessment';

function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const predictions = location.state?.predictions;
  const capturedImage = location.state?.capturedImage;
  const assessmentData = location.state?.answers;

  const assessmentQuestions = [
    { id: 1, text: "Does it feel itchy?" },
    { id: 2, text: "Does it hurt or feel sore when you touch it?" },
    { id: 3, text: "Does it look like a ring or circle on the skin?" },
    { id: 4, text: "Have you noticed the spot getting darker, bigger, or changing shape?" },
    { id: 5, text: "Do you see small blisters filled with clear fluid?" },
    { id: 6, text: "Does the skin feel rough, scaly, or flaky?" },
    { id: 7, text: "Does the spot look uneven in shape or have more than one color?" },
    { id: 8, text: "Does it look like a small bump that sticks up from the skin?" },
    { id: 9, text: "Does it look smooth and shiny, or as if it's sitting on top of the skin like a sticker?" }
  ];

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
        recommendations: desc.recommendations || []
      };
    })
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 1);

  const totalProb = sortedPredictionsRaw.reduce((sum, pred) => sum + pred.probability, 0);
  const sortedPredictions = totalProb > 0
    ? sortedPredictionsRaw.map(pred => ({
      ...pred,
      originalProbability: pred.probability,
      probability: pred.probability / totalProb
    }))
    : sortedPredictionsRaw.map(pred => ({
      ...pred,
      originalProbability: pred.probability
    }));

  const topPrediction = sortedPredictions[0];
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
          </style>
        </head>
        <body>
          <h1>Skin Condition Analysis Report</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <img src="${capturedImage}" alt="Skin" width="300"/>
          <div class="urgency ${urgencyLevel}">Urgency: ${urgencyLevel.toUpperCase()}</div>
          ${sortedPredictions.map(pred => `
            <div class="condition">
              <h2>${pred.name} (${(pred.probability * 100).toFixed(1)}%)</h2>
              <p><strong>Severity:</strong> ${pred.severity}</p>
              <p>${pred.description}</p>
              <p>${pred.description1}</p>
              <h4>Recommendations:</h4>
              <ul>${pred.recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>
            </div>
          `).join('')}
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

  const diseaseCategory = () => {
    const category = getTargetCategory(topPrediction.condition);
    const weightedCategories = calculateWeightedResults(assessmentData, topPrediction.condition);
    const categoryData = weightedCategories[category] || {};

    // take top 4
    const top4 = Object.entries(categoryData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    // sum only the top 4 scores
    const total = top4.reduce((sum, [, score]) => sum + score, 0);

    // normalize top 4 to 100%
    return top4.map(([disease, score]) => {
      const percentage = total > 0 ? (score / total) * 100 : 0;
      return [disease, Number(percentage.toFixed(1))];
    });
  };

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
            
            {diseaseCategory().map(([disease, value], index) => {
              const key = disease.replace(/_/g, ' ');
              const info = CONDITION_DESCRIPTIONS[key];

              return (
                <div key={index} className="condition-card">
                  <h3 className='section-title'>{info?.name || key}</h3>
                  <p className='description'>{info?.description || "No description available."}</p>
                  <p className='condition-probability'>
                    Weighted Probability: {value}%
                  </p>
                  <p className='severity'>Severity: {info?.severity || "Unknown"}</p>
                </div>
              );
            })}
          </div>

          {/* RIGHT - Assessment Answers, Recommendations & Image */}
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
            
            {/* Self-Assessment Answers Section */}
            {assessmentData && Object.keys(assessmentData).length > 0 && (
              <div className="result-section">
                <h2 className="section-title"><FaClipboardList /> Self-Assessment Answers</h2>
                <div className="assessment-answers-list">
                  {assessmentQuestions.map((question) => (
                    <div key={question.id} className="assessment-answer-item">
                      <div className="assessment-question">
                        <FaUser className="assessment-icon" />
                        <span className="question-text">{question.text}</span>
                      </div>
                      <div className="assessment-answer">
                        {assessmentData[question.id] || 'Not answered'}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="weighting-info">
                  <p className="weighting-note">
                    <FaCheckCircle className="info-icon" />
                    These answers are used to weight the diagnostic results for more accurate predictions.
                  </p>
                </div>
              </div>
            )}
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

export default ResultsPage
