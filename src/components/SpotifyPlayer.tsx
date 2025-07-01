import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import './SpotifyPlayer.css';

interface SpotifyPlayerProps {
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export default function SpotifyPlayer({ onPlayStateChange }: SpotifyPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [position, setPosition] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Fake track info for Sandstorm
  const currentTrack = {
    name: "Sandstorm",
    artist: "Darude",
    album: "Before the Storm",
    duration: 227000 // 3:47 in milliseconds
  };

  useEffect(() => {
    onPlayStateChange?.(isPlaying);
  }, [isPlaying, onPlayStateChange]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (audioRef.current && isPlaying) {
        setPosition(audioRef.current.currentTime * 1000);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seek = (ms: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = ms / 1000;
      setPosition(ms);
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (position / currentTrack.duration) * 100;

  return (
    <div className="retro-spotify-player">
      {/* Hidden audio element */}
      <audio 
        ref={audioRef}
        src="/audio/sandstorm.mp3"
        onEnded={() => {
          setIsPlaying(false);
          setPosition(0);
        }}
      />

      {/* Connection Status */}
      <div className="retro-spotify-status">
        <div className="retro-spotify-indicator connected">
          <span className="retro-spotify-dot"></span>
          🎵 FAKE AUDIO PLAYER ACTIVE
        </div>
      </div>

      {/* Current Track Info */}
      <div className="retro-spotify-track">
        <div className="retro-spotify-track-info">
          <div className="retro-spotify-track-name">
            🎵 {currentTrack.name}
          </div>
          <div className="retro-spotify-track-artist">
            by {currentTrack.artist}
          </div>
          <div className="retro-spotify-track-album">
            from "{currentTrack.album}"
          </div>
          <div className="retro-spotify-track-status">
            🔊 DEMO MODE - NOT REAL SPOTIFY
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="retro-spotify-progress">
        <div className="retro-spotify-time">
          {formatTime(position)}
        </div>
        <div className="retro-spotify-progress-bar">
          <div 
            className="retro-spotify-progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
          <input
            type="range"
            min="0"
            max={currentTrack.duration}
            value={position}
            onChange={(e) => seek(parseInt(e.target.value))}
            className="retro-spotify-progress-slider"
          />
        </div>
        <div className="retro-spotify-time">
          {formatTime(currentTrack.duration)}
        </div>
      </div>

      {/* Controls */}
      <div className="retro-spotify-controls">
        <motion.button
          onClick={togglePlay}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="retro-spotify-button retro-spotify-play"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </motion.button>

        <div className="retro-spotify-volume">
          <span className="retro-spotify-volume-icon">🔊</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="retro-spotify-volume-slider"
          />
          <span className="retro-spotify-volume-value">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

      {/* Equalizer Visualization */}
      <div className={`retro-spotify-equalizer ${isPlaying ? 'active' : ''}`}>
        {[...Array(8)].map((_, i) => (
          <div 
            key={i} 
            className="retro-spotify-eq-bar"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>

      {/* Demo Notice */}
      <div className="retro-spotify-demo">
        <div className="retro-spotify-demo-text">
          🎵 FAKE PLAYER DEMO 🎵
        </div>
        <div className="retro-spotify-demo-info">
          Playing: Darude - Sandstorm (Local MP3)
          <br />
          NOT connected to Spotify API
        </div>
      </div>
    </div>
  );
}