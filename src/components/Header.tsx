import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import logoFull from '../assets/logo-full.svg';
import logoMobile from '../assets/favicon.svg';

interface HeaderProps {
  onNavigateToLevelSelection: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigateToLevelSelection }) => {
  const { currentLevel } = useAppContext();
  const navigate = useNavigate();

  const handleLevelNav = () => {
    // Allow App.tsx to intercept (e.g. guard quiz exit) but fall back to direct nav
    if (onNavigateToLevelSelection) {
      onNavigateToLevelSelection();
    } else {
      navigate('/level');
    }
  };

  return (
    <div className="app-header-outer">
      <header className="app-header">
        <div className="logo">
          <img src={logoFull} alt="decki.ai" className="logo-full" />
          <img src={logoMobile} alt="decki.ai" className="logo-mobile" />
        </div>
        <div className="header-level-container">
          <span className="current-level-display">{currentLevel}</span>
          <button className="select-level-btn" onClick={handleLevelNav}>
            Select level
          </button>
        </div>
      </header>
    </div>
  );
};

export default Header;
