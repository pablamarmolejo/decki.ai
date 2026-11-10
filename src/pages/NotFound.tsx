import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoFull from '../assets/logo-full.svg';
import logoMobile from '../assets/favicon.svg';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="level-selection-page">
      <div className="level-selection-header">
        <img src={logoFull} alt="decki.ai" className="logo-full" />
        <img src={logoMobile} alt="decki.ai" className="logo-mobile" />
      </div>
      <div className="level-selection-content" style={{ textAlign: 'center' }}>
        <h1 className="level-selection-main-heading" style={{ fontSize: '48px', marginBottom: '8px' }}>
          404
        </h1>
        <p style={{
          fontFamily: "'Noto Sans JP', sans-serif",
          fontSize: '18px',
          color: '#2f2f3b',
          fontWeight: '500',
          marginBottom: '32px'
        }}>
          Page not found
        </p>
        <button
          className="level-btn-large"
          onClick={() => navigate('/decks')}
          style={{ maxWidth: '220px', margin: '0 auto' }}
        >
          Back to Decks
        </button>
      </div>
    </div>
  );
};

export default NotFound;
