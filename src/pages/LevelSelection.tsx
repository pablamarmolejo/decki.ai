import React from 'react';
import { useAppContext } from '../AppContext';
import type { Level } from '../types';
import logoFull from '../assets/logo-full.svg';

interface LevelSelectionProps {
  onLevelSelected: () => void;
}

const LevelSelection: React.FC<LevelSelectionProps> = ({ onLevelSelected }) => {
  const { currentLevel, setCurrentLevel } = useAppContext();
  const levels: Level[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

  const handleLevelClick = (level: Level) => {
    setCurrentLevel(level);
    onLevelSelected();
  };

  return (
    <div className="level-selection-page">
      <div className="level-selection-content">
        <div className="level-selection-logo">
          <img src={logoFull} alt="decki.ai" />
        </div>
        
        <h1 className="welcome-heading">Welcome to decki.ai</h1>
        
        <div className="level-selection-container">
          <h2 className="select-level-heading">Select your level</h2>
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
    </div>
  );
};

export default LevelSelection;
