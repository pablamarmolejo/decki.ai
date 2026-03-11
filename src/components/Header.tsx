import React from 'react';
import { useAppContext } from '../AppContext';
import logoFull from '../assets/logo-full.svg';

interface HeaderProps {
  onNavigateToLevelSelection: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigateToLevelSelection }) => {
  const { currentLevel } = useAppContext();

  return (
    <div className="app-header-outer">
      <header className="app-header">
        <div className="logo">
          <img src={logoFull} alt="decki.ai" className="logo-full" />
        </div>
        <div className="header-level-container">
          <span className="current-level-display">{currentLevel}</span>
          <button className="select-level-btn" onClick={onNavigateToLevelSelection}>
            Select level
          </button>
        </div>
      </header>
    </div>
  );
};

export default Header;
