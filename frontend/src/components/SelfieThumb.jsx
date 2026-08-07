import { useState } from 'react';
import { X } from 'lucide-react';

const SelfieModal = ({ src, alt = 'Selfie', onClose }) => {
  if (!src) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          padding: '1rem',
          position: 'relative',
          maxWidth: '500px',
          width: '100%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="btn btn-secondary btn-icon"
          onClick={onClose}
          style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', zIndex: 1 }}
        >
          <X size={16} />
        </button>
        <img
          src={src}
          alt={alt}
          style={{
            width: '100%',
            borderRadius: 'var(--radius-lg)',
            display: 'block',
          }}
        />
        <p className="text-xs text-muted text-center" style={{ marginTop: '0.75rem' }}>
          {alt}
        </p>
      </div>
    </div>
  );
};

const SelfieThumb = ({ src, label = 'View selfie' }) => {
  const [showModal, setShowModal] = useState(false);

  if (!src) return <span className="text-xs text-muted">No photo</span>;

  return (
    <>
      <img
        src={src}
        alt={label}
        className="selfie-thumb"
        onClick={() => setShowModal(true)}
        title={label}
      />
      {showModal && (
        <SelfieModal src={src} alt={label} onClose={() => setShowModal(false)} />
      )}
    </>
  );
};

export default SelfieThumb;
