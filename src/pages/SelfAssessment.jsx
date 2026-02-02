import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import './css/SelfAssessment.css';
import { DISEASES } from './ConditionAttr';
import { getPersonalizedQuestions } from './selfAssessmentQuestions'
import { getTargetCategory } from './utils/categoryUtils';
import { CATEGORY_THRESHOLDS } from './utils/thresholdConfig';

const handleAnswer = (setAnswers, questionId, answer) => {
  setAnswers(prev => ({
    ...prev,
    [questionId]: answer
  }));
};

const ASSESSMENT_MAPPING = {
  1: 0, 
  2: 1, 
  3: 2, 
  4: 3,
  5: 4, 
  6: 5, 
  7: 6, 
  8: 7, 
  9: 8 
};

const calculateArrayAverage = (arr) => {
  if (arr.length === 0) return 0;
  const sum = arr.reduce((total, val) => total + val, 0);
  return sum / arr.length;
};

const getAnswerValue = (answer) => {
  return answer.toLowerCase().includes('yes') ? 1 : 0;
};

const calculateDiseaseAverages = (diseaseCategoryObject) => {
  if (!diseaseCategoryObject || typeof diseaseCategoryObject !== 'object') {
    return {};
  }
  
  const DISEASE_AVERAGES = {};
  for (const [disease, data] of Object.entries(diseaseCategoryObject)) {
    if (data && data.weights && Array.isArray(data.weights)) {
      DISEASE_AVERAGES[disease] = calculateArrayAverage(data.weights);
    }
  }
  return DISEASE_AVERAGES;
};

const CATEGORY_SCORE_MAP = {
  'INFLAMMATORY': DISEASES.INFLAMMATORY,
  'INFECTIOUS': DISEASES.INFECTIOUS,
  'AUTOIMMUNE': DISEASES.AUTOIMMUNE,
  'BENIGN_GROWTH': DISEASES.BENIGN_GROWTH,
  'PIGMENTARY': DISEASES.PIGMENTARY,
  'SKIN_CANCER': DISEASES.SKIN_CANCER,
  'ENVIRONMENTAL': DISEASES.ENVIRONMENTAL,
};

const calculateWeightedResults = (assessmentAnswers, topPredictionCondition) => {
  const results = {};

  if (!assessmentAnswers || Object.keys(assessmentAnswers).length === 0) {
    return results;
  }

  const targetCategoryKey = getTargetCategory(topPredictionCondition);
  const targetCategoryDiseases = CATEGORY_SCORE_MAP[targetCategoryKey];
  
  if (!targetCategoryDiseases) {
    return results;
  }
  
  const targetDiseaseAverages = calculateDiseaseAverages(targetCategoryDiseases);

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

const checkDiseaseThreshold = (scores, category = 'DEFAULT') => {
  if (!scores || Object.keys(scores).length === 0) return false;
  
  const threshold = CATEGORY_THRESHOLDS[category] || CATEGORY_THRESHOLDS.DEFAULT;
  
  const top4 = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const total = top4.reduce((sum, [, score]) => sum + score, 0);
  const filteredTop4 = top4.filter(([, score]) => score > 0);
  const filteredTotal = filteredTop4.reduce((sum, [, score]) => sum + score, 0);
  
  if (filteredTop4.length === 0) return false;
  
  for (const [disease, score] of filteredTop4) {
    const percentage = (score / filteredTotal) * 100;
    if (percentage >= threshold) {
      return true;
    }
  }
  
  return false;
};

function SelfAssessment() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [diseaseScores, setDiseaseScores] = useState({});
  const [autoProceed, setAutoProceed] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentCategory, setCurrentCategory] = useState('');
  const [topPrediction, setTopPrediction] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const capturedImage = location.state?.capturedImage;
  const predictions = location.state?.predictions;

  useEffect(() => {
    if (predictions) {
      const { questions: personalizedQuestions, category, topPrediction: prediction } = getPersonalizedQuestions(predictions);
      setQuestions(personalizedQuestions);
      setCurrentCategory(category);
      setTopPrediction(prediction);
    }
  }, [predictions]);

  const calculateAllDiseaseScores = (currentAnswers, topPredictionCondition) => {
    if (!currentAnswers || Object.keys(currentAnswers).length === 0) {
      return {};
    }

    const targetCategoryKey = getTargetCategory(topPredictionCondition);
    const targetCategoryDiseases = CATEGORY_SCORE_MAP[targetCategoryKey];
    
    if (!targetCategoryDiseases) {
      return {};
    }
    
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
    if (Object.keys(answers).length > 0 && topPrediction) {
      const scores = calculateAllDiseaseScores(answers, topPrediction);
      setDiseaseScores(scores);

      const targetCategory = getTargetCategory(topPrediction);
      const shouldProceed = checkDiseaseThreshold(scores, targetCategory);
      
      if (shouldProceed && !autoProceed) {
        setAutoProceed(true);
        handleCompletion(scores);
      }
    }
  }, [answers, topPrediction]);

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

  const handleCompletion = (preCalculatedScores = null) => {
    setIsLoading(true);
    
    const randomDelay = Math.random() * 4 + 1; 
    
    setTimeout(() => {
      localStorage.setItem('assessmentAnswers', JSON.stringify(answers));
      navigate('/results', { 
        state: { 
          capturedImage,
          predictions,
          answers,
          diseaseScores: preCalculatedScores || diseaseScores,
          adaptive: true,
          assessmentCategory: currentCategory
        }
      });
    }, randomDelay * 1000);
  };

  const currentQuestion = questions[step - 1];
  const isLastQuestion = step === questions.length;

  if (questions.length === 0) {
    return (
      <div className="assessment-container">
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Loading personalized assessment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="assessment-container">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>
              {autoProceed 
                ? "Diagnosis confirmed, Proceeding to results..." 
                : "Processing your assessment..."
              }
            </p>
          </div>
        </div>
      )}

      <div className="assessment-card">
        {(!capturedImage || !predictions) && (
          <div style={{ marginBottom: '16px', color: '#e53e3e' }}>
            Missing image or predictions. Please start from the upload step.
          </div>
        )}
        
        {autoProceed && (
          <div style={{ 
            marginBottom: '16px', 
            padding: '12px',
            backgroundColor: '#d4edda',
            color: '#155724',
            border: '1px solid #c3e6cb',
            borderRadius: '4px'
          }}>
            <strong>High confidence match detected!</strong> Proceeding to results...
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
          <h3>{currentQuestion?.text}</h3>
          <div className="options-grid">
            {currentQuestion?.options.map((option, index) => (
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
              onClick={() => handleCompletion()}
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
  checkDiseaseThreshold
};