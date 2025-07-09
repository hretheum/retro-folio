import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScrollProgressBarProps {
  scrollProgress: number;
  isTransitioning: boolean;
  sectionOverflows: boolean;
  currentSection: number;
  totalSections: number;
  sectionScrollProgress?: number;
}

const ScrollProgressBar: React.FC<ScrollProgressBarProps> = ({
  scrollProgress,
  isTransitioning,
  sectionOverflows,
  currentSection,
  totalSections,
  sectionScrollProgress = 0
}) => {
  return (
    <>
      {/* Scroll Progress Indicator */}
      <AnimatePresence>
        {scrollProgress > 0 && !isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="retro-scroll-indicator"
          >
            <div className="retro-scroll-content">
              <div className="retro-scroll-label">
                {sectionOverflows ? 'SCROLLING IN SECTION...' : 'CHANGING SECTION...'}
              </div>
              <div className="retro-scroll-bar">
                <motion.div
                  className="retro-scroll-progress"
                  animate={{ width: `${scrollProgress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <div className="retro-scroll-percent">
                {Math.round(scrollProgress)}%
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section Progress Bar */}
      <div className="retro-progress-bar">
        <motion.div
          className="retro-progress-fill"
          animate={{ 
            width: `${((currentSection + 1) / totalSections) * 100}%` 
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
        {/* Section Scroll Progress Overlay */}
        {sectionOverflows && sectionScrollProgress > 0 && (
          <motion.div
            className="retro-progress-section-scroll"
            animate={{ 
              width: `${sectionScrollProgress * (100 / totalSections)}%` 
            }}
            transition={{ duration: 0.1 }}
          />
        )}
      </div>
    </>
  );
};

export default ScrollProgressBar;