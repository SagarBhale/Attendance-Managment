import { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RotateCcw, Check } from 'lucide-react';

const CameraCapture = ({ onCapture, onCancel }) => {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [error, setError] = useState(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
    }
  }, []);

  const retake = () => setCapturedImage(null);

  const confirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const handleUserMediaError = () => {
    setError('Camera access denied. Please allow camera permissions.');
  };

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--danger)' }}>
        <Camera size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <p>{error}</p>
        <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={onCancel}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="camera-container">
        {capturedImage ? (
          <img src={capturedImage} alt="Captured selfie" className="camera-selfie" />
        ) : (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode, width: 480, height: 360 }}
              className="camera-video"
              onUserMediaError={handleUserMediaError}
              mirrored={facingMode === 'user'}
            />
            <div className="camera-overlay">
              <div className="camera-guide" />
            </div>
          </>
        )}
      </div>

      <div className="camera-controls">
        {capturedImage ? (
          <>
            <button className="btn btn-secondary btn-sm" onClick={retake}>
              <RotateCcw size={14} /> Retake
            </button>
            <button className="btn btn-success btn-sm" onClick={confirm} id="confirm-selfie-btn">
              <Check size={14} /> Use Photo
            </button>
          </>
        ) : (
          <>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setFacingMode((m) => (m === 'user' ? 'environment' : 'user'))}
              title="Switch camera"
            >
              <RotateCcw size={14} /> Flip
            </button>
            <button className="btn btn-primary btn-sm" onClick={capture} id="capture-selfie-btn">
              <Camera size={14} /> Capture
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onCancel}>
              Cancel
            </button>
          </>
        )}
      </div>

      <p className="text-xs text-muted text-center" style={{ marginTop: '0.5rem' }}>
        Position your face within the circle
      </p>
    </div>
  );
};

export default CameraCapture;
