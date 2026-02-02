import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import './css/SelfAssessment.css';
import { DISEASES } from './ConditionAttr';
import { getTargetCategory } from './utils/categoryUtils';

// Question definitions with their attribute mappings
const QUESTIONS = [
  {
    id: 1,
    text: "Does it feel itchy?",
    options: ["Yes", "Not at all"],
    attributeIndex: 0 // itchy
  },
  {
    id: 2,
    text: "Does it hurt or feel sore when you touch it?",
    options: ["Yes", "Not at all"],
    attributeIndex: 1 // painful
  },
  {
    id: 3,
    text: "Does it look like a ring or circle on the skin?",
    options: ["Yes", "Not at all"],
    attributeIndex: 2 // ring_shape
  },
  {
    id: 4,
    text: "Have you noticed the spot getting darker, bigger, or changing shape?",
    options: ["Yes", "Not at all"],
    attributeIndex: 3 // changing_shape
  },
  {
    id: 5,
    text: "Do you see small blisters filled with clear fluid?",
    options: ["Yes", "Not at all"],
    attributeIndex: 4 // blisters
  },
  {
    id: 6,
    text: "Does the skin feel rough, scaly, or flaky?",
    options: ["Yes", "Not at all"],
    attributeIndex: 5 // rough_scaly
  },
  {
    id: 7,
    text: "Does the spot look uneven in shape or have more than one color?",
    options: ["Yes", "Not at all"],
    attributeIndex: 6 // uneven_shape
  },
  {
    id: 8,
    text: "Does it look like a small bump that sticks up from the skin?",
    options: ["Yes", "Not at all"],
    attributeIndex: 7 // bump
  },
  {
    id: 9,
    text: "Does it look smooth and shiny, or as if it's sitting on top of the skin like a sticker?",
    options: ["Yes", "Not at all"],
    attributeIndex: 8 // shiny_sticker
  }
];

const CATEGORY_SCORE_MAP = {
  'INFLAMMATORY': DISEASES.INFLAMMATORY,
  'INFECTIOUS': DISEASES.INFECTIOUS,
  'AUTOIMMUNE': DISEASES.AUTOIMMUNE,
  'BENIGN_GROWTH': DISEASES.BENIGN_GROWTH,
  'PIGMENTARY': DISEASES.PIGMENTARY,
  'SKIN_CANCER': DISEASES.SKIN_CANCER,
  'ENVIRONMENTAL': DISEASES.ENVIRONMENTAL,
};

const getAnswerValue = (answer) => {
  return answer.toLowerCase().includes('yes') ? 1 : 0;
};

// Calculate question importance based on variance in weights across diseases
const calculateQuestionImportance = (categoryDiseases, attributeIndex, answeredQuestions) => {
  if (!categoryDiseases) return 0;

  const weights = [];
  const attributes = [];

  // Collect weights and attributes for this question across all diseases
  Object.values(categoryDiseases).forEach(disease => {
    if (disease.weights && disease.weights[attributeIndex] !== undefined) {
      weights.push(disease.weights[attributeIndex]);
      attributes.push(disease.attributes[attributeIndex]);
    }
  });

  if (weights.length === 0) return 0;

  // Calculate variance - higher variance means more differentiating power
  const mean = weights.reduce((a, b) => a + b, 0) / weights.length;
  const variance = weights.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / weights.length;

  // Boost importance if this question can eliminate many diseases
  const nonZeroCount = weights.filter(w => w > 0).length;
  const eliminationPower = (weights.length - nonZeroCount) / weights.length;

  // Calculate how well this question helps narrow down remaining possibilities
  const importance = variance * 0.7 + eliminationPower * 0.3;

  return importance;
};

// Get next question using adaptive logic
const getNextQuestion = (answeredQuestions, categoryDiseases, allQuestions) => {
  if (!categoryDiseases) {
    // If no category, return first unanswered question
    return allQuestions.find(q => !answeredQuestions.has(q.id));
  }

  // Calculate current disease scores
  const diseaseScores = calculateCurrentScores(answeredQuestions, categoryDiseases);

  // Find unanswered questions
  const unansweredQuestions = allQuestions.filter(q => !answeredQuestions.has(q.id));

  if (unansweredQuestions.length === 0) return null;

  // Score each unanswered question based on:
  // 1. How well it differentiates between remaining likely diseases
  // 2. Information gain (entropy reduction)
  const questionScores = unansweredQuestions.map(question => {
    const importance = calculateQuestionImportance(
      categoryDiseases,
      question.attributeIndex,
      answeredQuestions
    );

    // Calculate information gain: how much this question would help narrow down
    const infoGain = calculateInformationGain(
      question,
      answeredQuestions,
      categoryDiseases,
      diseaseScores
    );

    return {
      question,
      score: importance * 0.6 + infoGain * 0.4
    };
  });

  // Sort by score and return the best question
  questionScores.sort((a, b) => b.score - a.score);
  return questionScores[0].question;
};

// Calculate information gain for a question
const calculateInformationGain = (question, answeredQuestions, categoryDiseases, currentScores) => {
  if (!categoryDiseases) return 0;

  // Find top diseases based on current scores
  const sortedDiseases = Object.entries(currentScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3); // Top 3 candidates

  let totalGain = 0;

  // For each possible answer (Yes/No), calculate how much it narrows down
  question.options.forEach(option => {
    const answerValue = getAnswerValue(option);
    let matchCount = 0;

    sortedDiseases.forEach(([diseaseName, score]) => {
      const disease = categoryDiseases[diseaseName];
      if (disease && disease.attributes[question.attributeIndex] === answerValue) {
        matchCount++;
      }
    });

    // Higher match count with top candidates = better question
    totalGain += matchCount / sortedDiseases.length;
  });

  return totalGain / question.options.length;
};

// Calculate current disease scores based on answers
const calculateCurrentScores = (answeredQuestions, categoryDiseases) => {
  const scores = {};
  const INITIAL_SCORE = 5;

  Object.entries(categoryDiseases).forEach(([diseaseName, diseaseData]) => {
    let totalWeight = INITIAL_SCORE;
    const { weights, attributes } = diseaseData;

    answeredQuestions.forEach((answer, questionId) => {
      const question = QUESTIONS.find(q => q.id === questionId);
      if (!question) return;

      const answerValue = getAnswerValue(answer);
      const attributeIndex = question.attributeIndex;

      if (weights[attributeIndex] !== undefined) {
        const characteristicValue = attributes[attributeIndex] || 0;

        if (answerValue !== characteristicValue) {
          // Wrong answer - penalize
          const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
          totalWeight -= avgWeight;
        } else {
          // Correct answer - reward
          if (answerValue === 0 && characteristicValue === 0) {
            const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
            totalWeight += avgWeight;
          } else if (answerValue === 1 && characteristicValue === 1) {
            totalWeight += weights[attributeIndex];
          }
        }
      }
    });

    scores[diseaseName] = Math.max(-10, totalWeight);
  });

  return scores;
};

// Check if we have enough confidence to stop early
const shouldStopEarly = (answeredQuestions, categoryDiseases, minQuestions = 3) => {
  if (answeredQuestions.size < minQuestions) return false;
  if (!categoryDiseases) return false;

  const scores = calculateCurrentScores(answeredQuestions, categoryDiseases);
  const sortedScores = Object.values(scores).sort((a, b) => b - a);

  // If top score is significantly higher than second, and we have reasonable confidence
  if (sortedScores.length >= 2) {
    const topScore = sortedScores[0];
    const secondScore = sortedScores[1];
    const confidenceGap = topScore - secondScore;

    // Stop if we have high confidence (>7) and significant gap (>3)
    if (topScore > 7 && confidenceGap > 3) {
      return true;
    }
  }

  return false;
};

function AdaptiveQuestionnaire() {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answers, setAnswers] = useState(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [diseaseScores, setDiseaseScores] = useState({});
  const [questionHistory, setQuestionHistory] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const capturedImage = location.state?.capturedImage;
  const predictions = location.state?.predictions;

  const getTopPrediction = () => {
    if (!predictions) return '';

    if (Array.isArray(predictions) && predictions.length > 0) {
      return predictions[0]?.condition || '';
    } else if (predictions.top_prediction) {
      return predictions.top_prediction;
    } else if (typeof predictions === 'string') {
      return predictions;
    }
    return '';
  };

  // Initialize first question
  useEffect(() => {
    const topPrediction = getTopPrediction();
    const category = getTargetCategory(topPrediction);
    const categoryDiseases = category ? CATEGORY_SCORE_MAP[category] : null;

    if (!category || !categoryDiseases) {
      console.warn(`No category found for prediction: ${topPrediction}. Showing all questions.`);
      // Fallback: show first question if category not found
      if (QUESTIONS.length > 0) {
        setCurrentQuestion(QUESTIONS[0]);
        setQuestionHistory([QUESTIONS[0].id]);
      }
      return;
    }

    const firstQuestion = getNextQuestion(new Map(), categoryDiseases, QUESTIONS);
    if (firstQuestion) {
      setCurrentQuestion(firstQuestion);
      setQuestionHistory([firstQuestion.id]);
    } else if (QUESTIONS.length > 0) {
      // Fallback to first question if no adaptive question found
      setCurrentQuestion(QUESTIONS[0]);
      setQuestionHistory([QUESTIONS[0].id]);
    }
  }, []);

  // Update disease scores when answers change
  useEffect(() => {
    const topPrediction = getTopPrediction();
    const category = getTargetCategory(topPrediction);
    const categoryDiseases = CATEGORY_SCORE_MAP[category];

    if (categoryDiseases && answers.size > 0) {
      const scores = calculateCurrentScores(answers, categoryDiseases);
      setDiseaseScores(scores);
    }
  }, [answers]);

  const handleAnswer = (questionId, answer) => {
    const newAnswers = new Map(answers);
    newAnswers.set(questionId, answer);
    setAnswers(newAnswers);

    // Determine next question
    const topPrediction = getTopPrediction();
    const category = getTargetCategory(topPrediction);
    const categoryDiseases = CATEGORY_SCORE_MAP[category];

    // Check if we should stop early
    if (shouldStopEarly(newAnswers, categoryDiseases)) {
      handleCompletion(newAnswers);
      return;
    }

    // Get next question
    const nextQuestion = getNextQuestion(newAnswers, categoryDiseases, QUESTIONS);

    if (nextQuestion) {
      setCurrentQuestion(nextQuestion);
      setQuestionHistory(prev => [...prev, nextQuestion.id]);
    } else {
      // No more questions
      handleCompletion(newAnswers);
    }
  };

  const handlePrevious = () => {
    if (questionHistory.length > 1) {
      const newHistory = [...questionHistory];
      newHistory.pop(); // Remove current
      const previousQuestionId = newHistory[newHistory.length - 1];
      const previousQuestion = QUESTIONS.find(q => q.id === previousQuestionId);

      if (previousQuestion) {
        setCurrentQuestion(previousQuestion);
        setQuestionHistory(newHistory);

        // Remove the answer for the current question
        const newAnswers = new Map(answers);
        newAnswers.delete(currentQuestion.id);
        setAnswers(newAnswers);
      }
    }
  };

  const handleCompletion = (finalAnswers = answers) => {
    setIsLoading(true);

    // Convert Map to object for storage
    const answersObj = {};
    finalAnswers.forEach((value, key) => {
      answersObj[key] = value;
    });

    // Calculate final disease scores
    const topPrediction = getTopPrediction();
    const category = getTargetCategory(topPrediction);
    const categoryDiseases = CATEGORY_SCORE_MAP[category];
    const finalScores = categoryDiseases ? calculateCurrentScores(finalAnswers, categoryDiseases) : {};

    const randomDelay = Math.random() * 2 + 1;

    setTimeout(() => {
      localStorage.setItem('assessmentAnswers', JSON.stringify(answersObj));
      navigate('/results', {
        state: {
          capturedImage,
          predictions,
          answers: answersObj,
          diseaseScores: finalScores,
          adaptive: true
        }
      });
    }, randomDelay * 1000);
  };

  if (!currentQuestion) {
    return (
      <div className="assessment-container">
        <div className="assessment-card">
          <p>Loading questionnaire...</p>
        </div>
      </div>
    );
  }

  const currentAnswer = answers.get(currentQuestion.id);
  const isFirstQuestion = questionHistory.length === 1;
  const isLastQuestion = answers.size >= QUESTIONS.length || !getNextQuestion(answers, 
    CATEGORY_SCORE_MAP[getTargetCategory(getTopPrediction())], QUESTIONS);

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

      <div className="assessment-card">
        {(!capturedImage || !predictions) && (
          <div style={{ marginBottom: '16px', color: '#e53e3e' }}>
            Missing image or predictions. Please start from the upload step.
          </div>
        )}

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(questionHistory.length / QUESTIONS.length) * 100}%` }}
          ></div>
        </div>

        <h2>Adaptive Assessment</h2>
        <p className="step-indicator">
          Question {questionHistory.length} {answers.size < QUESTIONS.length ? '(Adaptive)' : ''}
        </p>

        <div className="question-section">
          <h3>{currentQuestion.text}</h3>
          <div className="options-grid">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className={`option-button ${currentAnswer === option ? 'selected' : ''}`}
                onClick={() => handleAnswer(currentQuestion.id, option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="navigation-buttons">
          {!isFirstQuestion && (
            <button className="nav-button" onClick={handlePrevious}>
              <FontAwesomeIcon icon={faArrowLeft} /> Previous
            </button>
          )}
          {currentAnswer && isLastQuestion && (
            <button
              className="nav-button done"
              onClick={() => handleCompletion()}
            >
              Complete Assessment <FontAwesomeIcon icon={faArrowRight} />
            </button>
          )}
        </div>

        {/* Debug info (optional - can be removed in production) */}
        {process.env.NODE_ENV === 'development' && Object.keys(diseaseScores).length > 0 && (
          <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
            <strong>Current Scores:</strong>
            {Object.entries(diseaseScores)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([disease, score]) => (
                <div key={disease}>
                  {disease}: {score.toFixed(2)}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdaptiveQuestionnaire;
