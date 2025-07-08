import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HamburgerMenuProps {
  currentSection: number;
  onSectionChange: (index: number) => void;
  sections: string[];
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ 
  currentSection, 
  onSectionChange, 
  sections 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleSectionSelect = (index: number) => {
    onSectionChange(index);
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Button */}
      <motion.button
        className="retro-hamburger"
        onClick={toggleMenu}
        whileTap={{ scale: 0.9 }}
        aria-label="Toggle Menu"
      >
        <div className={`retro-hamburger-inner ${isOpen ? 'retro-hamburger-open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="retro-hamburger-text">MENU</div>
      </motion.button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="retro-menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu Panel */}
            <motion.div
              className="retro-mobile-menu"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="retro-mobile-menu-header">
                <div className="retro-mobile-menu-title">
                  🌐 Navigation
                </div>
                <button 
                  className="retro-mobile-menu-close"
                  onClick={() => setIsOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className="retro-mobile-menu-content">
                <div className="retro-mobile-menu-section">
                  <h3 className="retro-mobile-menu-subtitle">📍 Sections</h3>
                  {sections.map((section, index) => (
                    <button
                      key={section}
                      onClick={() => handleSectionSelect(index)}
                      className={`retro-mobile-menu-item ${
                        currentSection === index ? 'retro-mobile-menu-item-active' : ''
                      }`}
                    >
                      <span className="retro-mobile-menu-item-icon">
                        {index === 0 && '🏠'}
                        {index === 1 && '👨‍💼'}
                        {index === 2 && '💼'}
                        {index === 3 && '📅'}
                        {index === 4 && '🎮'}
                        {index === 5 && '📖'}
                        {index === 6 && '📧'}
                      </span>
                      <span className="retro-mobile-menu-item-text">{section}</span>
                      {currentSection === index && (
                        <span className="retro-mobile-menu-item-indicator">●</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="retro-mobile-menu-section">
                  <h3 className="retro-mobile-menu-subtitle">🔗 Quick Links</h3>
                  <a href="mailto:eof@offline.pl" className="retro-mobile-menu-link">
                    📧 Contact Me
                  </a>
                  <button 
                    onClick={() => handleSectionSelect(5)}
                    className="retro-mobile-menu-link"
                  >
                    📖 Sign Guestbook
                  </button>
                </div>

                <div className="retro-mobile-menu-footer">
                  <div className="retro-mobile-menu-status">
                    <span className="retro-mobile-menu-status-dot"></span>
                    ONLINE
                  </div>
                  <div className="retro-mobile-menu-time">
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


    </>
  );
};

export default HamburgerMenu;