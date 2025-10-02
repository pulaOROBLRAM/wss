import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUpload, faCamera, faArrowRight, faUndo, faSpinner } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import './css/UploadPage.css';

function UploadPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageSource, setImageSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location.state?.capturedImage) {
      setSelectedImage(location.state.capturedImage);
      setImageSource('camera');
    }
  }, [location.state]);

  const handleCameraClick = () => {
    navigate('/camera');
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        setImageSource('upload');
      };
      reader.readAsDataURL(file);
    }
  };

  const dataURLtoFile = (dataUrl, filename) => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleProceed = async () => {
    if (selectedImage) {
      setLoading(true);
      setError(null);

      try {
        const imageFile = dataURLtoFile(selectedImage, 'image.jpg');
        const formData = new FormData();
        formData.append('file', imageFile);

        const response = await axios.post('http://localhost:5000/predict', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        navigate('/assessment', {
          state: {
            capturedImage: selectedImage,
            predictions: response.data
          }
        });
      } catch (err) {
        setError('Error analyzing image. Please try again.');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImageSource('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="upload-container">
      {!selectedImage ? (
        <div className="upload-options">
          <div className="upload-option">
            <div className="option-circle">
              <FontAwesomeIcon icon={faCloudUpload} className="option-icon" />
            </div>
            <h2>Upload Image</h2>
            <p>Choose an image from your device</p>
            <input
              ref={fileInputRef}
              type="file"
              id="file-upload"
              className="file-input"
              accept="image/*"
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload" className="upload-btn">
              Choose File
            </label>
          </div>

          <div className="upload-option">
            <div className="option-circle">
              <FontAwesomeIcon icon={faCamera} className="option-icon" />
            </div>
            <h2>Take Photo</h2>
            <p>Use your camera to take a photo</p>
            <button className="upload-btn" onClick={handleCameraClick}>
              Open Camera
            </button>
          </div>
        </div>
      ) : (
        <div className="preview-container">
          <h2>Image Preview</h2>
          <p>Review your {imageSource === 'camera' ? 'captured photo' : 'uploaded image'}</p>
          <div className="image-preview">
            <img src={selectedImage} alt="Preview" />
          </div>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          <div className="preview-actions">
            <button 
              className="upload-btn secondary" 
              onClick={handleReset}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faUndo} /> Choose Different Image
            </button>
            <button 
              className="upload-btn" 
              onClick={handleProceed}
              disabled={loading}
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin /> Analyzing...
                </>
              ) : (
                <>
                  Continue <FontAwesomeIcon icon={faArrowRight} />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadPage; 