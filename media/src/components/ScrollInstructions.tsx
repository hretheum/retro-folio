import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScrollInstructionsProps {
  currentSection: number;
  isTransitioning: boolean;
  scrollProgress: number;
}

const ScrollInstructions: React.FC<ScrollInstructionsProps> = ({
  currentSection,
  isTransitioning,
  scrollProgress
}) => {
  return (
    <AnimatePresence>
      {currentSection === 0 && !isTransitioning && scrollProgress === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ delay: 2 }}
          className="retro-scroll-help"
        >
          <div className="retro-scroll-help-content">
            <div className="retro-blink">⬇️ SCROLL DOWN FOR MORE COOL STUFF! ⬇️</div>
            <div className="retro-scroll-help-text">
              Use mouse wheel, arrow keys, or swipe on mobile!
            </div>
            <div className="retro-scroll-help-music">
              🎵 Check out the music player in the sidebar! 🎵
            </div>
            <div className="retro-scroll-help-saturn">
              🪐 Watch Saturn follow your cursor! 🪐
            </div>
            <div className="retro-scroll-help-guestbook">
              📖 Don't forget to sign the guestbook! 📖
            </div>
            <div className="retro-scroll-help-smart">
              📜 Long sections auto-scroll within, then advance to next!
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScrollInstructions;