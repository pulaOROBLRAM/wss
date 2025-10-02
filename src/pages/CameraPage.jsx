import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCamera, FaRedo, FaSave } from 'react-icons/fa';
import './css/CameraPage.css';

function CameraPage() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [capturedImage, setCapturedImage] = useState(null);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setIsLoading(false);
    } catch (err) {
      setError('Unable to access camera. Please make sure you have granted camera permissions.');
      setIsLoading(false);
      console.error('Error accessing camera:', err);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageDataUrl);
        
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleSave = () => {
    if (capturedImage) {
      navigate('/upload', { 
        state: { 
          capturedImage,
          fromCamera: true
        } 
      });
    }
  };

  return (
    <div className="camera-container">
      <div className="camera-view">
        {isLoading && (
          <div className="loading-spinner" />
        )}
        
        {error && (
          <div className="error-message">{error}</div>
        )}

        {!error && (
          <>
            <video
              ref={videoRef}
              className="video-stream"
              autoPlay
              playsInline
              style={{ display: capturedImage ? 'none' : 'block' }}
            />
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />
            {capturedImage && (
              <img
                src={capturedImage}
                alt="Captured"
                className="captured-image"
                style={{ display: 'block' }}
              />
            )}
          </>
        )}
      </div>

      <div className="camera-controls">
        {!capturedImage ? (
          <button
            className="camera-btn"
            onClick={captureImage}
            disabled={!stream || isLoading}
          >
            <FaCamera /> Take Photo
          </button>
        ) : (
          <>
            <button className="camera-btn" onClick={retakePhoto}>
              <FaRedo /> Retake
            </button>
            <button className="camera-btn" onClick={handleSave}>
              <FaSave /> Use Photo
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default CameraPage; 