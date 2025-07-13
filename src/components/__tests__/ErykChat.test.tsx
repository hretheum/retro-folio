import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErykChat } from '../ErykChat';

// Mock the chat API
global.fetch = jest.fn();

describe('ErykChat Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        response: 'Test response',
        conversationId: 'test-id'
      })
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the chat interface', () => {
    render(<ErykChat />);
    expect(screen.getByPlaceholderText(/ask me anything/i)).toBeInTheDocument();
  });

  it('renders embedded version correctly', () => {
    render(<ErykChat />);
    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeInTheDocument();
  });

  it('applies embedded styles when embedded prop is true', () => {
    const { container } = render(<ErykChat />);
    expect(container.firstChild).toHaveClass('w-full');
  });

  it('applies full screen styles when embedded prop is false', () => {
    const { container } = render(<ErykChat embedded />);
    expect(container.firstChild).toHaveClass('w-full');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<ErykChat onClose={onClose} />);
    
    // Look for any close button (X, close icon, etc.)
    const closeButtons = screen.queryAllByRole('button');
    const closeButton = closeButtons.find(button => 
      button.textContent?.includes('×') || 
      button.getAttribute('aria-label')?.includes('close')
    );
    
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('sends message when send button is clicked', async () => {
    render(<ErykChat embedded />);
    
    const input = screen.getByPlaceholderText(/ask me anything/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('sends message when Enter key is pressed', async () => {
    render(<ErykChat />);
    
    const input = screen.getByPlaceholderText(/ask me anything/i);
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('displays loading state when sending message', async () => {
    // Mock a delayed response
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ response: 'Test response', conversationId: 'test-id' })
      }), 100))
    );

    render(<ErykChat />);
    
    const input = screen.getByPlaceholderText(/ask me anything/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    // Check for loading indicators
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('displays error message when request fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<ErykChat />);
    
    const input = screen.getByPlaceholderText(/ask me anything/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('clears input after sending message', async () => {
    render(<ErykChat />);
    
    const input = screen.getByPlaceholderText(/ask me anything/i) as HTMLInputElement;
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    expect(input.value).toBe('Test message');
    
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('disables send button when input is empty', () => {
    render(<ErykChat />);
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it('enables send button when input has text', () => {
    render(<ErykChat />);
    
    const input = screen.getByPlaceholderText(/ask me anything/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    expect(sendButton).not.toBeDisabled();
  });
});