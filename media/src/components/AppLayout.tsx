import React from 'react';
import { Link } from 'react-router-dom';

interface AppLayoutProps {
  children: React.ReactNode;
  onSectionChange?: (index: number) => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, onSectionChange }) => {
  return (
    <div className="retro-main-container">
      {/* Header */}
      <header className="retro-header">
        <div className="retro-header-content">
          <h1 className="retro-title">
            🌟 Welcome to Eryk's AWESOME Homepage! 🌟
          </h1>
          <div className="retro-subtitle">
            <span className="retro-blink">✨ UNDER CONSTRUCTION ✨</span>
            <span className="retro-flame">🔥</span>
            <span className="retro-new">NEW!</span>
            <span className="retro-saturn">🪐 SATURN CURSOR!</span>
            <span className="retro-guestbook">📖 GUESTBOOK!</span>
          </div>
        </div>
      </header>

      {children}

      {/* Footer */}
      <footer className="retro-footer">
        <div className="retro-footer-content">
          <div className="retro-footer-text">
            <span className="retro-blink">🌟</span>
            Best viewed in Netscape Navigator 4.0+ at 800x600 resolution
            <span className="retro-blink">🌟</span>
          </div>
          <div className="retro-footer-links">
            <a href="#" className="retro-footer-link">📧 Webmaster</a>
            <span className="retro-separator">|</span>
            <a href="#" className="retro-footer-link">📊 Site Stats</a>
            <span className="retro-separator">|</span>
            <a href="#" className="retro-footer-link">🔗 Link Exchange</a>
            <span className="retro-separator">|</span>
            <a href="#" className="retro-footer-link" onClick={() => onSectionChange?.(5)}>📖 Guestbook</a>
            <span className="retro-separator">|</span>
            <Link to="/admin" className="retro-footer-link">⚙️ Admin</Link>
          </div>
          <div className="retro-copyright">
            © 1998-2025 Eryk Orłowski - All Rights Reserved
            <br />
            <span className="retro-music-credit">
              🎵 Powered by Retro Music Player 🎵
            </span>
            <br />
            <span className="retro-saturn-credit">
              🪐 Enhanced with Saturn Cursor Magic 🪐
            </span>
            <br />
            <span className="retro-guestbook-credit">
              📖 Sign the Guestbook for Fame! 📖
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;