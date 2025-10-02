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

const CONDITION_DESCRIPTIONS = {
  "Acne": {
    name: "Acne",
    description: "Acne appears as pimples and blackheads on the face, back, or chest, while rosacea shows as redness and small bumps on the cheeks and nose.",
    severity: "low",
    recommendations: ["Keep your face clean, avoid scrubbing and tiggers. try over-the-counter creams. For stubborn cases, see a doctor for prescription creams or pills.", "Be gentle with your skin, avoid your triggers, and ask about creams or pills to calm the redness and swelling.",
      {
        text: "Consult a dermatologist for personalized advice.",
        link: "https://dermatologysolutions.as.me/schedule/d6bc36cb"
      }
    ]
  },
  "Actinic Keratosis Basal Cell Carcinoma and other Malignant Lesions": {
    name: "Actinic Keratosis Basal Cell Carcinoma and other Malignant Lesions",
    description: "Rough spots or growths from too much sun that could turn into skin cancer if ignored.",
    severity: "moderate",
    recommendations: ["Don’t ignore these—get them checked. Your doctor may freeze, scrape, or remove them. Sunscreen is your best friend.", 
      {
        text: "Consult a dermatologist for personalized advice.",
        link: "https://dermatologysolutions.as.me/schedule/d6bc36cb"
      }
    ]
  },
  "Atopic Dermatitis": {
    name: "Atopic Dermatitis",
    description: "Itchy, dry, or red patches—often from allergies or skin that’s sensitive to irritants.",
    severity: "moderate",
    recommendations: ["Moisturize often, avoid triggers like soaps or fabrics, and use gentle creams to reduce itching.", 
      {
        text: "Consult a dermatologist for personalized advice.",
        link: "https://dermatologysolutions.as.me/schedule/d6bc36cb"
      }
    ]
  },
  "Bullous Disease": {
    name: "Bullous Disease",
    description: "Painful blisters that appear when the body attacks the skin—can be serious and need long-term care.",
    severity: "moderate",
    recommendations: ["Don’t pop the blisters. See a specialist for proper diagnosis. Treatment often includes steroids or immune-calming meds.", 
      {
        text: "Consult a dermatologist for personalized advice.",
        link: "https://dermatologysolutions.as.me/schedule/d6bc36cb"
      }
    ]
  },
  "Cellulitis Impetigo and other Bacterial Infections": {
    name: "Cellulitis Impetigo and other Bacterial Infections",
    description: "Red, swollen, or crusty areas on the skin from bacteria. Can spread quickly.",
    severity: "high",
    recommendations: ["Don’t wait—these usually need antibiotics. Keep the area clean and avoid picking.",
      {
        text: "Consult a dermatologist for personalized advice.",
        link: "https://dermatologysolutions.as.me/schedule/d6bc36cb"
      }
    ]
  },
  "Eczema": {
    name: "Eczema",
    description: "Itchy, dry, or red patches—often from allergies or skin that’s sensitive to irritants.",
    severity: "moderate",
    recommendations: ["Moisturize often, avoid triggers like soaps or fabrics, and use gentle creams to reduce itching.", 
      {
        text: "Consult a dermatologist for personalized advice.",
        link: "https://dermatologysolutions.as.me/schedule/d6bc36cb"
      }
    ]
  },
  "Exanthems and Drug Eruptions": {
    name: "Exanthems and Drug Eruptions",
    description: "Widespread rashes from infections or medications—may come with fever or itching.",
    severity: "high",
    recommendations: ["Stop any new meds and see a doctor. Mild cases get better with rest and antihistamines. Severe ones need urgent care.",
      {
        text: "Consult a dermatologist for personalized advice.",
        link: "https://dermatologysolutions.as.me/schedule/d6bc36cb"
      }
    ]
  },
  "Hair Loss Alopecia and other Hair Diseases": {
    name: "Hair Loss Alopecia and other Hair Diseases",
    description: "Hair falls out in patches or thins over time due to stress, illness, or immune causes.",
    severity: "low",
    recommendations: ["Some hair loss gets better on its own. Treatments like minoxidil or steroid injections can help. Talk to your doctor early.", 
      {
        text: "Consult a dermatologist for personalized advice.",
        link: "https://dermatologysolutions.as.me/schedule/d6bc36cb"
      }
    ]
  },
  "Herpes HPV and other STDs": {
    name: "Herpes HPV and other STDs",
    description: "Painful blisters or warts on or near the genitals, mouth, or anus caused by viruses.",
    severity: "high",
    recommendations: ["Practice safe sex, get tested, and ask your doctor about antiviral medications or wart treatments.",
      {
        text: "Consult a dermatologist for personalized advice.",
        link: "https://dermatologysolutions.as.me/schedule/d6bc36cb"
      }
    ]
  },
  "Light Diseases and Disorders of Pigmentation": {
    name: "Light Diseases and Disorders of Pigmentation",
    description: "Uneven skin color—like light or dark patches—from pigment loss or excess.",
    severity: "low",
    recommendations: ["Protect your skin from the sun and try prescribed creams. Some people may benefit from lasers or light therapy.",
      {
        text: "Consult a dermatologist for personalized advice.",
        link: "https://dermatologysolutions.as.me/schedule/d6bc36cb"
      }
    ]
  },
  "Lupus and other Connective Tissue diseases": {
    name: "Lupus and other Connective Tissue diseases",
    description: "Autoimmune diseases that affect skin and sometimes internal organs—may show as rashes, hair loss, or ulcers.",
    severity: "high",
    recommendations: ["Wear sunscreen every day. See a doctor regularly to manage flares and protect organs with medication if needed.",
      {
        text: "Consult a dermatologist for personalized advice.",
        link: "https://dermatologysolutions.as.me/schedule/d6bc36cb"
      }
    ]
  },
  "Melanoma Skin Cancer Nevi and Moles": {
    name: "Melanoma Skin Cancer Nevi and Moles",
    description: "Spots or moles that change in shape, size, or color and could be cancer.",
    severity: "moderate",
    recommendations: ["Get your moles checked regularly. If one looks different, see a doctor. Early removal saves lives.",
      {
        text: "Consult a dermatologist for personalized advice.",
        link: "https://dermatologysolutions.as.me/schedule/d6bc36cb"
      }
    ]
  },
  "Nail Fungus and other Nail Disease": {
    name: "Nail Fungus and other Nail Disease",
    description: "Thick, yellowed, or brittle nails—usually caused by fungal infections.",
    severity: "low",
    recommendations: ["Keep nails trimmed and dry. OTC creams may help, but pills from your doctor work best.",
      {
        text: "Consult a dermatologist for personalized advice.",
        link: "https://dermatologysolutions.as.me/schedule/d6bc36cb"
      }
    ]
  },
  "Poison Ivy and other Contact Dermatitis": {
    name: "Poison Ivy and other Contact Dermatitis",
    description: "Itchy, red rash from touching plants, soaps, or metals your skin doesn’t like.",
    severity: "Unknown",
    recommendations: ["Avoid what caused it, apply soothing creams, and don’t scratch. For bad cases, a short course of steroids may help.",
      {
        text: "Consult a dermatologist for personalized advice.",
        link: "https://dermatologysolutions.as.me/schedule/d6bc36cb"
      }
    ]
  },
  "Psoriasis pictures Lichen Planus and related diseases": {
    name: "Psoriasis pictures Lichen Planus and related diseases",
    description: "Red, scaly patches on the skin that come and go—often on the scalp, elbows, or knees.",
    severity: "moderate",
    recommendations: ["Moisturize, manage stress, and try prescription creams or light therapy. Severe types may need injectable medications.",
      {
        text: "Consult a dermatologist for personalized advice.",
        link: "https://dermatologysolutions.as.me/schedule/d6bc36cb"
      }
    ]
  },
  "Scabies Lyme Disease and other Infestations and Bites": {
    name: "Scabies Lyme Disease and other Infestations and Bites",
    description: "Description for Scabies Lyme Disease and other Infestations and Bites.",
    severity: "Unknown",
    recommendations: ["Consult a dermatologist for personalized advice.",
      {
        text: "Consult a dermatologist for personalized advice.",
        link: "https://dermatologysolutions.as.me/schedule/d6bc36cb"
      }
    ]
  },
  "Seborrheic Keratoses and other Benign Tumors": {
    name: "Infectious Skin Disease",
    description: "Harmless brown or black stuck-on growths—common as people age.",
    severity: "low",
    recommendations: ["No treatment is needed unless they bother you. A doctor can freeze or shave them off if needed.",
      {
        text: "Consult a dermatologist for personalized advice.",
        link: "https://dermatologysolutions.as.me/schedule/d6bc36cb"
      }
     ]
  },
  "Systemic Disease": {
    name: "Systemic Disease",
    description: "Diseases in other parts of the body (like the liver or thyroid) that show up as rashes or skin changes.",
    severity: "moderate",
    recommendations: ["Treating the main condition usually helps the skin. Don’t ignore new skin changes—tell your doctor.",
      {
        text: "Consult a dermatologist for personalized advice.",
        link: "https://dermatologysolutions.as.me/schedule/d6bc36cb"
      }
    ]
  },
  "Tinea Ringworm Candidiasis and other Fungal Infections": {
    name: "Tinea Ringworm Candidiasis and other Fungal Infections",
    description: "Itchy, red, ring-shaped rashes or white patches from fungal infections.",
    severity: "moderate",
    recommendations: ["Use antifungal creams and keep skin dry. See a doctor if it doesn’t go away or keeps coming back.",
      {
        text: "Consult a dermatologist for personalized advice.",
        link: "https://dermatologysolutions.as.me/schedule/d6bc36cb"
      }
    ]
  },
  "Urticaria Hives": {
    name: "Urticaria Hives",
    description: "Sudden itchy welts or swelling from allergies, heat, or unknown causes.",
    severity: "moderate",
    recommendations: ["Try antihistamines and figure out your triggers. If it lasts longer than 6 weeks, see a doctor.",
      {
        text: "Consult a dermatologist for personalized advice.",
        link: "https://dermatologysolutions.as.me/schedule/d6bc36cb"
      }
    ]
  },
  "Vascular Tumors": {
    name: "Vascular Tumors",
    description: "Growths made of blood vessels, like red “strawberry” marks in babies.",
    severity: "low",
    recommendations: ["Most shrink over time. If they bleed, grow fast, or block vision, see a specialist.",
      {
        text: "Consult a dermatologist for personalized advice.",
        link: "https://dermatologysolutions.as.me/schedule/d6bc36cb"
      }
    ]
  },
  "Vasculitis": {
    name: "Vasculitis",
    description: "Inflamed blood vessels cause purple spots, ulcers, or painful patches.",
    severity: "moderate",
    recommendations: ["Don’t ignore these—they may signal something serious. Doctors may give steroids or other immune medications.",
      {
        text: "Consult a dermatologist for personalized advice.",
        link: "https://dermatologysolutions.as.me/schedule/d6bc36cb"
      }
    ]
  },
  "Warts Molluscum and other Viral Infections": {
    name: "Warts Molluscum and other Viral Infections",
    description: "Bumps on the skin from viruses—can spread by touch.",
    severity: "low",
    recommendations: ["Leave them alone or try over-the-counter treatments. Doctors can freeze or treat them if they don’t go away.",
      {
        text: "Consult a dermatologist for personalized advice.",
        link: "https://dermatologysolutions.as.me/schedule/d6bc36cb"
      }
    ]
  }
};

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
        severity: desc.severity || "Unknown",
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
            
            <div className='disease-category'>
              <p className='category-name'>{/* topPrediction.condition*/}(Inflammatory Diseases - Static)</p>
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
