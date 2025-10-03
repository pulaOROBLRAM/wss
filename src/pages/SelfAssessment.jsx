import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faArrowRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import './css/SelfAssessment.css';

const handleAnswer = (setAnswers, questionId, answer) => {
  setAnswers(prev => ({
    ...prev,
    [questionId]: answer
  }));
};

// Format: [itchy, painful, ring_shape, changing_shape, blisters, rough_scaly, uneven_shape, bump, shiny_sticker]
const DISEASES = {
  INFLAMMATORY: {
    "Acne": {
      attributes: [1, 1, 0, 1, 1, 0, 0, 1, 0],
      weights: [0.2, 0.7, 0, 0.7, 0.2, 0, 0, 1, 0]
    },
    "Acne_Keloidalis_Nuchae": {
      attributes: [1, 1, 0, 1, 0, 0, 0, 1, 0],
      weights: [0.7, 0.7, 0, 0.7, 0, 0, 0, 1, 0]
    },
    "Atopic_Dermatitis": {
      attributes: [1, 1, 0, 1, 1, 1, 1, 1, 0],
      weights: [1, 0.2, 0, 0.5, 0.5, 0.7, 0.5, 0.5, 0]
    },
    "Contact_Dermatitis": {
      attributes: [1, 1, 0, 1, 1, 1, 1, 1, 0],
      weights: [1, 0.5, 0, 0.7, 0.7, 0.7, 0.5, 0.5, 0]
    },
    "Seborrheic_Dermatitis": {
      attributes: [1, 0, 0, 1, 0, 1, 1, 1, 0],
      weights: [0.7, 0, 0, 0.5, 0, 1, 0.5, 0.2, 0]
    },
    "Psoriasis": {
      attributes: [1, 1, 1, 1, 1, 1, 1, 1, 1],
      weights: [0.7, 0.5, 0.5, 0.5, 0.2, 1, 0.7, 0.7, 0.5]
    }
  },

  INFECTIOUS: {
    "Boils": {
      attributes: [1, 1, 0, 1, 1, 1, 1, 1, 0],
      weights: [0.3, 0.8, 0, 0.3, 0.8, 0.2, 0.3, 0.9, 0]
    },
    "Cellulitis": {
      attributes: [1, 1, 0, 1, 1, 1, 1, 1, 0],
      weights: [0.2, 0.9, 0, 0.4, 0.3, 0.1, 0.2, 0.1, 0]
    },
    "Folliculitis": {
      attributes: [1, 1, 0, 1, 1, 1, 1, 1, 0],
      weights: [0.4, 0.6, 0, 0.2, 0.5, 0.3, 0.2, 0.8, 0]
    },
    "Ipetigo": {
      attributes: [1, 1, 0, 1, 1, 1, 1, 1, 0],
      weights: [0.3, 0.4, 0, 0.3, 0.7, 0.6, 0.3, 0.2, 0]
    },
    "Skin_Infections": {
      attributes: [1, 1, 0, 1, 1, 1, 1, 1, 0],
      weights: [0.4, 0.7, 0, 0.4, 0.6, 0.3, 0.3, 0.5, 0]
    },
    "Cold_Sores": {
      attributes: [1, 1, 0, 1, 1, 1, 1, 1, 0],
      weights: [0.5, 0.8, 0, 0.2, 0.9, 0.1, 0.2, 0.3, 0]
    }
  },

  AUTOIMMUNE: {
    "Vitiligo": {
      attributes: [0, 0, 0, 1, 0, 0, 1, 0, 0],
      weights: [0, 0, 0, 0.3, 0, 0, 0.8, 0, 0]
    },
    "Lupus": {
      attributes: [1, 1, 0, 1, 1, 1, 1, 1, 0],
      weights: [0.3, 0.2, 0, 0.2, 0.4, 0.3, 0.4, 0.1, 0]
    },
    "Drug_Induced_Pigmentation": {
      attributes: [1, 0, 0, 1, 0, 0, 1, 0, 0],
      weights: [0.1, 0, 0, 0.8, 0, 0, 0.6, 0, 0]
    },
    "Lichen_related_diseases": {
      attributes: [1, 1, 0, 1, 1, 1, 1, 1, 0],
      weights: [0.6, 0.3, 0, 0.3, 0.2, 0.8, 0.5, 0.2, 0]
    }
  },

  BENIGN_GROWTH: {
    "Dermatofibroma": {
      attributes: [1, 1, 0, 1, 0, 0, 1, 1, 1],
      weights: [0.1, 0.2, 0, 0.1, 0, 0, 0.3, 0.9, 0.3]
    },
    "Digital_Mucous_Cyst": {
      attributes: [0, 1, 0, 1, 0, 0, 1, 1, 1],
      weights: [0, 0.3, 0, 0.1, 0, 0, 0.2, 0.8, 0.5]
    },
    "Cyst": {
      attributes: [0, 1, 0, 1, 0, 0, 1, 1, 1],
      weights: [0, 0.4, 0, 0.2, 0, 0, 0.2, 0.9, 0.2]
    },
    "Lipoma": {
      attributes: [0, 1, 0, 1, 0, 0, 1, 1, 1],
      weights: [0, 0.1, 0, 0.1, 0, 0, 0.1, 0.8, 0.4]
    },
    "Keloids": {
      attributes: [1, 1, 0, 1, 0, 0, 1, 1, 1],
      weights: [0.2, 0.3, 0, 0.2, 0, 0, 0.3, 0.9, 0.1]
    }
  },

  PIGMENTARY: {
    "Age_Spots": {
      attributes: [0, 0, 0, 1, 0, 0, 1, 0, 1],
      weights: [0, 0, 0, 0.1, 0, 0, 0.2, 0, 0.8]
    },
    "Dyschromia": {
      attributes: [0, 0, 0, 1, 0, 0, 1, 0, 1],
      weights: [0, 0, 0, 0.3, 0, 0, 0.7, 0, 0.6]
    },
    "Melasma": {
      attributes: [0, 0, 0, 1, 0, 0, 1, 0, 1],
      weights: [0, 0, 0, 0.2, 0, 0, 0.5, 0, 0.7]
    },
    "Hyperpigmentation": {
      attributes: [0, 0, 0, 1, 0, 0, 1, 0, 1],
      weights: [0, 0, 0, 0.4, 0, 0, 0.6, 0, 0.5]
    },
    "Varicose_Veins": {
      attributes: [1, 1, 0, 1, 0, 0, 1, 0, 1],
      weights: [0.3, 0.4, 0, 0.1, 0, 0, 0.2, 0, 0.3]
    }
  },

  SKIN_CANCER: {
    "Actinic_Keratosis": {
      attributes: [1, 1, 0, 1, 0, 1, 1, 1, 1],
      weights: [0.2, 0.1, 0, 0.6, 0, 0.8, 0.4, 0.3, 0.2]
    },
    "Basal_Cell_Cancer": {
      attributes: [1, 1, 0, 1, 0, 1, 1, 1, 1],
      weights: [0.1, 0.2, 0, 0.7, 0, 0.3, 0.5, 0.4, 0.3]
    },
    "Squamous_Cell_Cancer": {
      attributes: [1, 1, 0, 1, 0, 1, 1, 1, 1],
      weights: [0.2, 0.3, 0, 0.8, 0, 0.4, 0.6, 0.3, 0.2]
    },
    "Melanoma": {
      attributes: [1, 1, 0, 1, 0, 1, 1, 1, 1],
      weights: [0.1, 0.1, 0, 0.9, 0, 0.2, 0.9, 0.2, 0.1]
    }
  },

  ENVIRONMENTAL: {
    "Poison_Ivy": {
      attributes: [1, 1, 0, 1, 1, 1, 1, 1, 0],
      weights: [0.9, 0.3, 0, 0.2, 0.6, 0.2, 0.3, 0.1, 0]
    },
    "Razor_Bumps": {
      attributes: [1, 1, 0, 1, 1, 1, 1, 1, 0],
      weights: [0.2, 0.4, 0, 0.1, 0.3, 0.1, 0.1, 0.8, 0]
    },
    "Dry_Skin": {
      attributes: [1, 1, 0, 1, 0, 1, 1, 0, 0],
      weights: [0.6, 0.1, 0, 0.1, 0, 0.9, 0.1, 0, 0]
    },
    "Hyperhidrosis": {
      attributes: [1, 0, 0, 1, 0, 1, 1, 0, 0],
      weights: [0.2, 0, 0, 0.1, 0, 0.3, 0.1, 0, 0]
    },
    "Sun_damage": {
      attributes: [1, 0, 0, 1, 0, 1, 1, 0, 1],
      weights: [0.1, 0, 0, 0.3, 0, 0.2, 0.4, 0, 0.6]
    }
  }
};


// Assessment question mapping to attribute indices
const ASSESSMENT_MAPPING = {
  1: 0, // "Does it feel itchy?" -> itchy attribute (index 0)
  2: 1, // "Does it hurt or feel sore when you touch it?" -> painful attribute (index 1)
  3: 2, // "Does it look like a ring or circle on the skin?" -> ring_shape attribute (index 2)
  4: 3, // "Have you noticed the spot getting darker, bigger, or changing shape?" -> changing_shape attribute (index 3)
  5: 4, // "Do you see small blisters filled with clear fluid?" -> blisters attribute (index 4)
  6: 5, // "Does the skin feel rough, scaly, or flaky?" -> rough_scaly attribute (index 5)
  7: 6, // "Does the spot look uneven in shape or have more than one color?" -> uneven_shape attribute (index 6)
  8: 7, // "Does it look like a small bump that sticks up from the skin?" -> bump attribute (index 7)
  9: 8  // "Does it look smooth and shiny, or as if it's sitting on top of the skin like a sticker?" -> shiny_sticker attribute (index 8)
};

// Function to calculate average of an array
const calculateArrayAverage = (arr) => {
  if (arr.length === 0) return 0;
  const sum = arr.reduce((total, val) => total + val, 0);
  return sum / arr.length;
};

// Function to get Yes/No answer value
const getAnswerValue = (answer) => {
  return answer.toLowerCase().includes('yes') ? 1 : 0;
};

// Calculate average score for each disease IN A GIVEN CATEGORY OBJECT
const calculateDiseaseAverages = (diseaseCategoryObject) => {
  const DISEASE_AVERAGES = {};
  for (const [disease, data] of Object.entries(diseaseCategoryObject)) {
    DISEASE_AVERAGES[disease] = calculateArrayAverage(data.weights);
  }
  return DISEASE_AVERAGES;
};

// Master object mapping category names to their score objects
const CATEGORY_SCORE_MAP = {
  'INFLAMMATORY': DISEASES.INFLAMMATORY,
  'INFECTIOUS': DISEASES.INFECTIOUS,
  'AUTOIMMUNE': DISEASES.AUTOIMMUNE,
  'BENIGN_GROWTH': DISEASES.BENIGN_GROWTH,
  'PIGMENTARY': DISEASES.PIGMENTARY,
  'SKIN_CANCER': DISEASES.SKIN_CANCER,
  'ENVIRONMENTAL': DISEASES.ENVIRONMENTAL,
};

const getTargetCategory = (topPredictionCondition) => {
  if (topPredictionCondition && topPredictionCondition.toLowerCase().includes('acne') || topPredictionCondition.toLowerCase().includes('dermatitis')) {
    return 'INFLAMMATORY';
  } else if (topPredictionCondition && topPredictionCondition.toLowerCase().includes('molluscum contagiosum') || topPredictionCondition.toLowerCase().includes('ringworm') || topPredictionCondition.toLowerCase().includes('warts')) {
    return 'INFECTIOUS';
  } else if (topPredictionCondition && topPredictionCondition.toLowerCase().includes('vitiligo')) {
    return 'AUTOIMMUNE';
  } else if (topPredictionCondition && topPredictionCondition.toLowerCase().includes('cancer')) {
    return 'SKIN_CANCER';
  } else if (topPredictionCondition && topPredictionCondition.toLowerCase().includes('pigmentary')) {
    return 'PIGMENTARY';
  } else if (topPredictionCondition && topPredictionCondition.toLowerCase().includes('environmental')) {
    return 'ENVIRONMENTAL';
  } 
};


const calculateWeightedResults = (assessmentAnswers, topPredictionCondition) => {
  const results = {};

  if (!assessmentAnswers || Object.keys(assessmentAnswers).length === 0) {
    return results;
  }

  const targetCategoryKey = getTargetCategory(topPredictionCondition);
  const targetCategoryDiseases = CATEGORY_SCORE_MAP[targetCategoryKey];
  const targetDiseaseAverages = calculateDiseaseAverages(targetCategoryDiseases);

  // Iterate over diseases in the target category
  Object.entries(targetCategoryDiseases).forEach(([diseaseName, diseaseData]) => {
    let totalWeight = 0;
    const { weights, attributes } = diseaseData;

    Object.entries(assessmentAnswers).forEach(([questionId, answer]) => {
      const qId = parseInt(questionId);
      const answerValue = getAnswerValue(answer);
      const attributeIndex = ASSESSMENT_MAPPING[qId];

      if (attributeIndex !== undefined && weights[attributeIndex] !== undefined) {
        const characteristicValue = attributes[attributeIndex] || 0;

        if (answerValue !== characteristicValue) {
          totalWeight -= targetDiseaseAverages[diseaseName];
        } else {
          if (answerValue === 0 && characteristicValue === 0) {
            totalWeight += targetDiseaseAverages[diseaseName];
          } else if (answerValue === 1 && characteristicValue === 1) {
            totalWeight += weights[attributeIndex];
          }
        }
      }
    });
    results[diseaseName] = Math.max(-10, totalWeight);
  });
  return { [targetCategoryKey]: results };
};


function SelfAssessment() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [diseaseScores, setDiseaseScores] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const capturedImage = location.state?.capturedImage;
  const predictions = location.state?.predictions;

  const questions = [
    {
      id: 1,
      text: "Does it feel itchy?",
      options: ["Yes", "Not at all"]
    },
    {
      id: 2,
      text: "Does it hurt or feel sore when you touch it?",
      options: ["Yes", "Not at all"]
    },
    {
      id: 3,
      text: "Does it look like a ring or circle on the skin?",
      options: ["Yes", "Not at all"]
    },
    {
      id: 4,
      text: "Have you noticed the spot getting darker, bigger, or changing shape?",
      options: ["Yes", "Not at all"]
    },
    {
      id: 5,
      text: "Do you see small blisters filled with clear fluid?",
      options: ["Yes", "Not at all"]
    },
    {
      id: 6,
      text: "Does the skin feel rough, scaly, or flaky?",
      options: ["Yes", "Not at all"]
    },
    {
      id: 7,
      text: "Does the spot look uneven in shape or have more than one color?",
      options: ["Yes", "Not at all"]
    },
    {
      id: 8,
      text: "Does it look like a small bump that sticks up from the skin?",
      options: ["Yes", "Not at all"]
    },
    {
      id: 9,
      text: "Does it look smooth and shiny, or as if it's sitting on top of the skin like a sticker?",
      options: ["Yes", "Not at all"]
    }
  ];

const calculateAllDiseaseScores = (currentAnswers, topPredictionCondition) => {
  if (!currentAnswers || Object.keys(currentAnswers).length === 0) {
    return {};
  }

  const targetCategoryKey = getTargetCategory(topPredictionCondition);
  const targetCategoryDiseases = CATEGORY_SCORE_MAP[targetCategoryKey];
  const targetDiseaseAverages = calculateDiseaseAverages(targetCategoryDiseases);
  const allScores = {};

  Object.entries(targetCategoryDiseases).forEach(([diseaseName, diseaseData]) => {
    const INITIAL_SCORE = 5;
    let totalWeight = INITIAL_SCORE;
    const { weights, attributes } = diseaseData;

    Object.entries(currentAnswers).forEach(([questionId, answer]) => {
      const qId = parseInt(questionId);
      const answerValue = getAnswerValue(answer);
      const attributeIndex = ASSESSMENT_MAPPING[qId];

      if (attributeIndex !== undefined && weights[attributeIndex] !== undefined) {
        const characteristicValue = attributes[attributeIndex] || 0;

        if (answerValue !== characteristicValue) {
          totalWeight -= targetDiseaseAverages[diseaseName];
        } else {
          if (answerValue === 0 && characteristicValue === 0) {
            totalWeight += targetDiseaseAverages[diseaseName];
          } else if (answerValue === 1 && characteristicValue === 1) {
            totalWeight += weights[attributeIndex];
          }
        }
      }
    });

    allScores[diseaseName] = Math.max(-10, totalWeight);
  });

  return allScores;
};

useEffect(() => {
  const topPrediction = predictions?.[0]?.condition || '';
  const scores = calculateAllDiseaseScores(answers, topPrediction);
  setDiseaseScores(scores);
}, [answers, predictions]);

  const handleAnswerInComponent = (questionId, answer) => {
    handleAnswer(setAnswers, questionId, answer);
  };

  const handleNext = () => {
    if (step < questions.length) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleCompletion = () => {
    setIsLoading(true);
    
    const randomDelay = Math.random() * 4 + 1; 
    
    setTimeout(() => {
      localStorage.setItem('assessmentAnswers', JSON.stringify(answers));
      navigate('/results', { 
        state: { 
          capturedImage,
          predictions,
          answers,
          diseaseScores
        }
      });
    }, randomDelay * 1000);
  };

const renderDebugPanel = () => {
    if (!showDebug) return null;
    const sortedDiseases = Object.entries(diseaseScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Show top 10 diseases

    return (
      <div className="debug-panel">
        <h3>
          <button 
            className="debug-close"
            onClick={() => setShowDebug(false)}
          >
            ×
          </button>
        </h3>
        
        <div className="debug-scores">
          {sortedDiseases.map(([disease, score]) => (
            <div key={disease} className="debug-score-item">
              <span className="disease-name">{disease.replace(/_/g, ' ')}</span>
              <span className="score-value">{score.toFixed(2)}</span>
              <div className="score-bar">
                <div 
                  className="score-fill" 
                  style={{ width: `${Math.min(score * 20, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="debug-answers">
          <h4>Current Answers:</h4>
          <pre>{JSON.stringify(answers, null, 2)}</pre>
        </div>
      </div>
    );
  };

  const currentQuestion = questions[step - 1];
  const isLastQuestion = step === questions.length;

  return (
    <div className="assessment-container">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Processing your assessment...</p>
          </div>
        </div>
      )}

      {/* Add debug toggle button */}
      <button 
        className="debug-toggle"
        onClick={() => setShowDebug(!showDebug)}
      >
        <p>debug</p>
      </button>
      
      {renderDebugPanel()}

      <div className="assessment-card">
        {(!capturedImage || !predictions) && (
          <div style={{ marginBottom: '16px', color: '#e53e3e' }}>
            Missing image or predictions. Please start from the upload step.
          </div>
        )}
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${(step / questions.length) * 100}%` }}
          ></div>
        </div>
        <h2>Self Assessment</h2>
        <p className="step-indicator">Step {step} of {questions.length}</p>

        <div className="question-section">
          <h3>{currentQuestion.text}</h3>
          <div className="options-grid">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className={`option-button ${answers[currentQuestion.id] === option ? 'selected' : ''}`}
                onClick={() => handleAnswerInComponent(currentQuestion.id, option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="navigation-buttons">
          {step > 1 && (
            <button className="nav-button" onClick={handlePrevious}>
              <FontAwesomeIcon icon={faArrowLeft} /> Previous
            </button>
          )}
          {!isLastQuestion ? (
            <button 
              className="nav-button next"
              onClick={handleNext}
              disabled={!answers[currentQuestion.id]}
            >
              Next <FontAwesomeIcon icon={faArrowRight} />
            </button>
          ) : (
            <button 
              className="nav-button done"
              onClick={handleCompletion}
              disabled={!answers[currentQuestion.id]}
            >
              Complete Assessment <FontAwesomeIcon icon={faArrowRight} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SelfAssessment;
export {
  DISEASES,
  ASSESSMENT_MAPPING,
  getAnswerValue,
  calculateArrayAverage,
  handleAnswer,
  calculateDiseaseAverages,
  calculateWeightedResults,
  getTargetCategory
};
