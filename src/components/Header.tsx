import React from 'react';
import { useAppContext } from '../AppContext';
import type { Level } from '../types';
import logoFull from '../assets/logo-full.svg';

interface HeaderProps {
  onNavigateToStudy: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigateToStudy }) => {
  const { currentLevel, setCurrentLevel } = useAppContext();
  const levels: Level[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

  const handleLevelClick = (level: Level) => {
    setCurrentLevel(level);
    onNavigateToStudy();
  };

  return (
    <div className="app-header-outer">
      <header className="app-header">
        <div className="logo">
          <img src={logoFull} alt="decki.ai" className="logo-full" />
        </div>
        <div className="level-selector">
          {levels.map((level) => (
            <button
              key={level}
              className={`level-btn ${currentLevel === level ? 'active' : ''}`}
              onClick={() => handleLevelClick(level)}
            >
              {level}
            </button>
          ))}
        </div>
      </header>
    </div>
  );
};

export default Header;
