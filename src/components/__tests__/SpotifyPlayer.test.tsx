import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SpotifyPlayer from '../SpotifyPlayer';

describe('SpotifyPlayer', () => {
  const mockOnPlayStateChange = jest.fn();

  beforeEach(() => {
    mockOnPlayStateChange.mockClear();
  });

  it('renders without crashing', () => {
    render(<SpotifyPlayer />);
    expect(screen.getByText('🎵 FAKE AUDIO PLAYER ACTIVE')).toBeInTheDocument();
  });

  it('displays track information', () => {
    render(<SpotifyPlayer />);
    expect(screen.getByText('🎵 Sandstorm')).toBeInTheDocument();
    expect(screen.getByText('by Darude')).toBeInTheDocument();
    expect(screen.getByText('from "Before the Storm"')).toBeInTheDocument();
  });

  it('toggles play/pause when button is clicked', async () => {
    const user = userEvent.setup();
    render(<SpotifyPlayer onPlayStateChange={mockOnPlayStateChange} />);
    
    const playButton = screen.getByTitle('Play');
    expect(playButton).toHaveTextContent('▶️');
    
    await user.click(playButton);
    
    await waitFor(() => {
      expect(mockOnPlayStateChange).toHaveBeenCalledWith(true);
    });
    
    const pauseButton = screen.getByTitle('Pause');
    expect(pauseButton).toHaveTextContent('⏸️');
    
    await user.click(pauseButton);
    
    await waitFor(() => {
      expect(mockOnPlayStateChange).toHaveBeenCalledWith(false);
    });
  });

  it('handles volume changes', async () => {
    render(<SpotifyPlayer />);
    
    // Get volume slider specifically by its class (there are two sliders in the component)
    const volumeSlider = document.querySelector('.retro-spotify-volume-slider') as HTMLInputElement;
    expect(volumeSlider).toHaveValue('0.7');
    expect(screen.getByText('70%')).toBeInTheDocument();
    
    fireEvent.change(volumeSlider, { target: { value: '0.5' } });
    
    expect(volumeSlider).toHaveValue('0.5');
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('shows equalizer animation when playing', async () => {
    const user = userEvent.setup();
    render(<SpotifyPlayer />);
    
    // Get equalizer element directly by class
    const equalizer = document.querySelector('.retro-spotify-equalizer');
    expect(equalizer).toBeTruthy();
    
    expect(equalizer).not.toHaveClass('active');
    
    const playButton = screen.getByTitle('Play');
    await user.click(playButton);
    
    expect(equalizer).toHaveClass('active');
  });

  it('displays demo mode message', () => {
    render(<SpotifyPlayer />);
    expect(screen.getByText('🎵 FAKE PLAYER DEMO 🎵')).toBeInTheDocument();
    expect(screen.getByText(/NOT connected to Spotify API/)).toBeInTheDocument();
  });

  it('formats time correctly', () => {
    render(<SpotifyPlayer />);
    // Initial position should be 0:00
    const timeElements = screen.getAllByText('0:00');
    expect(timeElements[0]).toBeInTheDocument();
    // Duration should be 3:47
    expect(screen.getByText('3:47')).toBeInTheDocument();
  });
});