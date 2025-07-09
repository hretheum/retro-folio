import React from 'react';
import { motion } from 'framer-motion';

interface NavigationProps {
  currentSection: number;
  onSectionChange: (index: number) => void;
  sections: string[];
}

export default function Navigation({ currentSection, onSectionChange, sections }: NavigationProps) {
  return (
    <nav className="retro-nav">
      <div className="retro-nav-content">
        {/* Logo/Brand */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2 }}
          className="retro-nav-brand"
        >
          <span className="retro-nav-logo">🌐</span>
          <span className="retro-nav-title">Eryk's Site</span>
        </motion.div>

        {/* Navigation Menu */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="retro-nav-menu"
        >
          {sections.map((section, index) => (
            <button
              key={section}
              onClick={() => onSectionChange(index)}
              className={`retro-nav-button ${
                currentSection === index ? 'retro-nav-button-active' : ''
              }`}
            >
              <span className="retro-nav-button-text">{section}</span>
              {currentSection === index && (
                <motion.div
                  layoutId="activeNavTab"
                  className="retro-nav-button-indicator"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </motion.div>

        {/* Retro Elements */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.6 }}
          className="retro-nav-extras"
        >
          <div className="retro-nav-time">
            {new Date().toLocaleTimeString()}
          </div>
          <div className="retro-nav-status">
            <span className="retro-nav-status-dot"></span>
            ONLINE
          </div>
        </motion.div>
      </div>
      
      <style jsx>{`
        .retro-nav {
          grid-area: nav;
          background: linear-gradient(90deg, 
            var(--retro-dark-gray) 0%, 
            var(--retro-gray) 50%, 
            var(--retro-dark-gray) 100%);
          border-bottom: 4px inset var(--retro-gray);
          padding: 0.5rem 1rem;
          box-shadow: 
            inset 1px 1px 2px rgba(255, 255, 255, 0.3),
            inset -1px -1px 2px rgba(0, 0, 0, 0.3);
        }

        .retro-nav-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .retro-nav-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--retro-black);
          font-weight: bold;
        }

        .retro-nav-logo {
          font-size: 1.2rem;
          animation: retro-spin 3s linear infinite;
        }

        @keyframes retro-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .retro-nav-title {
          font-size: 1rem;
          text-shadow: 1px 1px 0 var(--retro-white);
        }

        .retro-nav-menu {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .retro-nav-button {
          position: relative;
          background: var(--retro-black);
          border: 2px outset var(--retro-gray);
          color: var(--retro-white);
          padding: 0.4rem 0.8rem;
          font-family: 'Comic Neue', 'Comic Sans MS', cursive;
          font-size: 0.8rem;
          font-weight: bold;
          cursor: pointer;
          text-shadow: 1px 1px 0 var(--retro-black);
          transition: all 0.2s ease;
          box-shadow: 
            inset 1px 1px 2px rgba(255, 255, 255, 0.2),
            inset -1px -1px 2px rgba(0, 0, 0, 0.5);
        }

        .retro-nav-button:hover {
          background: var(--retro-electric-blue);
          color: var(--retro-white);
          transform: translateY(-1px);
        }

        .retro-nav-button-active {
          background: var(--retro-hot-pink);
          border: 2px inset var(--retro-gray);
          color: var(--retro-white);
          animation: retro-pulse 2s infinite;
        }

        .retro-nav-button-text {
          position: relative;
          z-index: 1;
        }

        .retro-nav-button-indicator {
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--retro-yellow);
          animation: retro-blink 1s infinite;
        }

        .retro-nav-extras {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: var(--retro-black);
          font-size: 0.7rem;
          font-weight: bold;
        }

        .retro-nav-time {
          font-family: 'Courier New', monospace;
          background: var(--retro-black);
          color: var(--retro-neon-green);
          padding: 0.2rem 0.4rem;
          border: 1px inset var(--retro-gray);
        }

        .retro-nav-status {
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .retro-nav-status-dot {
          width: 8px;
          height: 8px;
          background: var(--retro-neon-green);
          border-radius: 50%;
          animation: retro-pulse 1s infinite;
        }

        @media (max-width: 768px) {
          .retro-nav-content {
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .retro-nav-menu {
            justify-content: center;
          }
          
          .retro-nav-button {
            font-size: 0.7rem;
            padding: 0.3rem 0.6rem;
          }
          
          .retro-nav-extras {
            font-size: 0.6rem;
          }
        }
      `}</style>
    </nav>
  );
}