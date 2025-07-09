import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErykChat } from '../ErykChat';

// Mock the useChat hook
jest.mock('ai/react', () => ({
  useChat: () => ({
    messages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Cześć! Jestem Eryk AI.',
      },
      {
        id: '1',
        role: 'user',
        content: 'Test message',
      },
      {
        id: '2',
        role: 'assistant',
        content: 'Test response',
      },
    ],
    input: '',
    handleInputChange: jest.fn(),
    handleSubmit: jest.fn(),
    isLoading: false,
    error: null,
  }),
}));

describe('ErykChat', () => {
  it('renders chat interface', () => {
    render(<ErykChat />);
    
    expect(screen.getByText('Eryk AI')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/zapytaj o projekty/i)).toBeInTheDocument();
    expect(screen.getByText(/Cześć! Jestem Eryk AI/)).toBeInTheDocument();
  });
  
  it('displays messages correctly', () => {
    render(<ErykChat />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByText('Test response')).toBeInTheDocument();
  });
  
  it('renders as modal by default', () => {
    const { container } = render(<ErykChat />);
    
    expect(container.querySelector('.eryk-chat.modal')).toBeInTheDocument();
  });
  
  it('renders as embedded when prop is set', () => {
    const { container } = render(<ErykChat embedded />);
    
    expect(container.querySelector('.eryk-chat.embedded')).toBeInTheDocument();
  });
  
  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<ErykChat onClose={onClose} />);
    
    const closeButton = screen.getByLabelText('Close chat');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });
  
  it('does not show close button in embedded mode', () => {
    render(<ErykChat embedded />);
    
    expect(screen.queryByLabelText('Close chat')).not.toBeInTheDocument();
  });
  
  it('focuses input on mount', () => {
    render(<ErykChat />);
    
    const input = screen.getByPlaceholderText(/zapytaj o projekty/i);
    expect(document.activeElement).toBe(input);
  });
  
  it('handles form submission', async () => {
    const { useChat } = jest.requireMock('ai/react');
    const handleSubmit = jest.fn();
    useChat.mockReturnValue({
      messages: [],
      input: 'Test question',
      handleInputChange: jest.fn(),
      handleSubmit,
      isLoading: false,
      error: null,
    });
    
    render(<ErykChat />);
    
    const form = screen.getByPlaceholderText(/zapytaj o projekty/i).closest('form');
    fireEvent.submit(form!);
    
    expect(handleSubmit).toHaveBeenCalled();
  });
  
  it('disables input when loading', () => {
    const { useChat } = jest.requireMock('ai/react');
    useChat.mockReturnValue({
      messages: [],
      input: '',
      handleInputChange: jest.fn(),
      handleSubmit: jest.fn(),
      isLoading: true,
      error: null,
    });
    
    render(<ErykChat />);
    
    const input = screen.getByPlaceholderText(/zapytaj o projekty/i);
    const button = screen.getByRole('button');
    
    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });
  
  it('displays error message', () => {
    const { useChat } = jest.requireMock('ai/react');
    useChat.mockReturnValue({
      messages: [],
      input: '',
      handleInputChange: jest.fn(),
      handleSubmit: jest.fn(),
      isLoading: false,
      error: new Error('Test error'),
    });
    
    render(<ErykChat />);
    
    expect(screen.getByText(/wystąpił błąd/i)).toBeInTheDocument();
  });
  
  it('saves messages to localStorage', () => {
    const mockSetItem = jest.spyOn(Storage.prototype, 'setItem');
    
    render(<ErykChat />);
    
    expect(mockSetItem).toHaveBeenCalledWith(
      expect.stringContaining('eryk-chat-session'),
      expect.stringContaining('Test message')
    );
    
    mockSetItem.mockRestore();
  });
  
  it('shows loading indicator', () => {
    const { useChat } = jest.requireMock('ai/react');
    useChat.mockReturnValue({
      messages: [],
      input: '',
      handleInputChange: jest.fn(),
      handleSubmit: jest.fn(),
      isLoading: true,
      error: null,
    });
    
    render(<ErykChat />);
    
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });
});