import React from 'react';
import { useAppContext } from '../AppContext';
import type { Level } from '../types';
import logoFull from '../assets/logo-full.svg';

const Header: React.FC = () => {
  const { currentLevel, setCurrentLevel } = useAppContext();
  const levels: Level[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

  return (
    <header className="app-header-outer">
      <div className="app-header">
        <div className="logo">
          <img src={logoFull} alt="decki.ai" style={{ height: '42px' }} />
        </div>
        <div className="level-selector">
          {levels.map((level) => (
            <button
              key={level}
              className={`level-btn ${currentLevel === level ? 'active' : ''}`}
              onClick={() => setCurrentLevel(level)}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;
