import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import type { Level } from '../types';
import logoFull from '../assets/logo-full.svg';
import logoMobile from '../assets/favicon.svg';

const LevelSelection: React.FC = () => {
  const { currentLevel, setCurrentLevel } = useAppContext();
  const navigate = useNavigate();
  const levels: Level[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

  const handleLevelClick = (level: Level) => {
    setCurrentLevel(level);
    navigate('/decks');
  };

  return (
    <>
      <div className="level-selection-header">
        <img src={logoFull} alt="decki.ai" className="logo-full" />
        <img src={logoMobile} alt="decki.ai" className="logo-mobile" />
      </div>
      
      <div className="level-selection-content">
        <h1 className="level-selection-main-heading">Select a level</h1>
        
        <div className="level-selection-container">
          <div className="level-selector-large">
            {levels.map((level) => (
              <button
                key={level}
                className={`level-btn-large ${currentLevel === level ? 'active' : ''}`}
                onClick={() => handleLevelClick(level)}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default LevelSelection;
