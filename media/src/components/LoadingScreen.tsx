import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  isLoaded: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoaded }) => {
  React.useEffect(() => {
    console.log('🔄 LoadingScreen mounted, isLoaded:', isLoaded);
    return () => {
      console.log('🚪 LoadingScreen unmounting');
    };
  }, [isLoaded]);
  
  return (
    <AnimatePresence>
      {!isLoaded && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="fixed inset-0 z-50 retro-loading"
        >
          <div className="retro-loading-content">
            <div className="retro-loading-text">
              🌐 LOADING AWESOME WEBSITE 🌐
            </div>
            <div className="retro-loading-bar">
              <div className="retro-loading-progress" />
            </div>
            <div className="retro-loading-subtext">
              ✨ Please wait while we load the coolest site on the web! ✨
            </div>
            <div className="retro-loading-music">
              🎵 Preparing epic music player... 🎵
            </div>
            <div className="retro-loading-saturn">
              🪐 Initializing Saturn cursor trail... 🪐
            </div>
            <div className="retro-loading-guestbook">
              📖 Loading guestbook entries... 📖
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;