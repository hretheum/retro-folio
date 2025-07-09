import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Section {
  component: React.ComponentType<any>;
  name: string;
}

interface SectionNavigatorProps {
  sections: Section[];
  currentSection: number;
  isTransitioning: boolean;
  sectionOverflows: boolean;
  onSectionChange: (index: number) => void;
}

const SectionNavigator: React.FC<SectionNavigatorProps> = ({
  sections,
  currentSection,
  isTransitioning,
  sectionOverflows,
  onSectionChange
}) => {
  return (
    <>
      {/* Section Indicators */}
      <div className="retro-nav-dots">
        {sections.map((_, index) => (
          <button
            key={index}
            onClick={() => onSectionChange(index)}
            disabled={isTransitioning}
            className={`retro-nav-dot ${
              currentSection === index ? 'retro-nav-dot-active' : ''
            }`}
            title={`${sections[index].name}${index === currentSection && sectionOverflows ? ' (Scrollable)' : ''}`}
          >
            {index + 1}
            {index === currentSection && sectionOverflows && (
              <div className="retro-nav-dot-scroll-indicator">📜</div>
            )}
          </button>
        ))}
      </div>

      {/* Section Title During Transition */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="retro-transition-title"
          >
            <div className="retro-transition-content">
              <div className="retro-transition-text">
                🌟 {sections[currentSection].name.toUpperCase()} 🌟
              </div>
              <div className="retro-transition-loading">
                <span>L</span><span>O</span><span>A</span><span>D</span><span>I</span><span>N</span><span>G</span><span>.</span><span>.</span><span>.</span>
              </div>
              {sectionOverflows && (
                <div className="retro-transition-scroll-hint">
                  📜 This section is scrollable!
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SectionNavigator;