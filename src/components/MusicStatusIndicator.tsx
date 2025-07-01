import React from 'react';

interface MusicStatusIndicatorProps {
  isMusicPlaying: boolean;
}

const MusicStatusIndicator: React.FC<MusicStatusIndicatorProps> = ({ isMusicPlaying }) => {
  if (!isMusicPlaying) return null;

  return (
    <div className="retro-music-status">
      <div className="retro-music-status-content">
        <span className="retro-music-status-icon">🎵</span>
        <span className="retro-music-status-text">MUSIC PLAYING</span>
      </div>
    </div>
  );
};

export default MusicStatusIndicator;