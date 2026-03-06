import React from 'react';
import logoIcon from '../assets/logo-icon.svg';

const Footer: React.FC = () => {
  return (
    <div className="app-footer-outer">
      <footer className="app-footer">
        <div className="footer-logo">
          <img src={logoIcon} alt="decki.ai" style={{ height: '24px' }} />
        </div>
        <div className="copyright">© 2026 decki.ai. All rights reserved.</div>
      </footer>
    </div>
  );
};

export default Footer;
