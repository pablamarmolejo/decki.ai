import React from 'react';
import { useAppContext } from '../AppContext';
import type { Level } from '../types';
import logoFull from '../assets/logo-full.svg';
import logoIconXl from '../assets/logo-icon-xl.svg';

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
    <>
      <div className="level-selection-header">
        <img src={logoFull} alt="decki.ai" className="logo-full" />
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
