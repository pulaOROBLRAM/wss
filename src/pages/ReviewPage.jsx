import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaCheck, FaImage } from 'react-icons/fa';
import './css/ReviewPage.css';

function ReviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [assessmentData, setAssessmentData] = useState(null);
  const [imageData, setImageData] = useState(null);

  // Questions from self-assessment
  const questions = [
    {
      id: 1,
      text: "When was the last time you went out?"
    },
    {
      id: 2,
      text: "How old are you?"
    },
    {
      id: 3,
      text: "How long have you noticed the skin condition?"
    },
    {
      id: 4,
      text: "Is the affected area itchy or painful?"
    },
    {
      id: 5,
      text: "Has the condition changed in appearance recently?"
    }
  ];

  useEffect(() => {
    // Load assessment answers from localStorage
    const savedAnswers = localStorage.getItem('assessmentAnswers');
    if (savedAnswers) {
      setAssessmentData(JSON.parse(savedAnswers));
    }

    // Get image from location state (from camera or upload)
    if (location.state?.capturedImage) {
      setImageData(location.state.capturedImage);
    }
  }, [location.state]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleSubmit = () => {
    console.log('Submit button clicked');
    console.log('Assessment Data:', assessmentData);
    console.log('Image Data exists:', !!imageData);
    
    if (assessmentData && imageData) {
      console.log('Preparing to navigate to results page');
      // Convert assessment data to array format for results page
      const assessmentArray = Object.values(assessmentData);
      console.log('Assessment Array:', assessmentArray);
      
      // Navigate to results page with both assessment and image data
      navigate('/results', {
        state: {
          assessmentData: assessmentArray,
          imageData,
          timestamp: new Date().toISOString()
        }
      });
      
      // Clear the stored assessment data since we're done with it
      localStorage.removeItem('assessmentAnswers');
    } else {
      console.log('Missing required data:', {
        hasAssessmentData: !!assessmentData,
        hasImageData: !!imageData
      });
    }
  };

  return (
    <div className="review-container">
      <div className="review-content">
        <div className="review-header">
          <h1>Review Your Submission</h1>
          <p>Please review your answers and image before submitting</p>
        </div>

        <div className="review-sections">
          <div className="assessment-section">
            <h2 className="section-title">Assessment Answers</h2>
            {questions.map((question) => (
              <div key={question.id} className="assessment-item">
                <div className="assessment-question">{question.text}</div>
                <div className="assessment-answer">
                  {assessmentData?.[question.id] || 'Not answered'}
                </div>
              </div>
            ))}
          </div>

          <div className="image-section">
            <h2 className="section-title">Uploaded Image</h2>
            {imageData ? (
              <img
                src={imageData}
                alt="Uploaded skin condition"
                className="uploaded-image"
              />
            ) : (
              <div className="image-placeholder">
                <FaImage size={48} />
                <p>No image uploaded</p>
              </div>
            )}
          </div>
        </div>

        <div className="review-actions">
          <button className="review-btn back-btn" onClick={handleBack}>
            <FaArrowLeft /> Back
          </button>
          <button 
            className="review-btn submit-btn" 
            onClick={handleSubmit}
            disabled={!assessmentData || !imageData}
          >
            <FaCheck /> Submit for Analysis
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReviewPage; 