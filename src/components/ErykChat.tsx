import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, X, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useChat } from 'ai/react';
import './ErykChat.css';

interface ErykChatProps {
  isOpen?: boolean;
  onClose?: () => void;
  embedded?: boolean;
}

export function ErykChat({ isOpen = true, onClose, embedded = false }: ErykChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'helpful' | 'not_helpful'>>({});
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/ai/chat',
    body: {
      sessionId,
    },
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Hi! I\'m Eryk AI. You can ask me about my experience, technology projects, leadership philosophy, or anything else related to my career. How can I help you?',
      },
    ],
    onError: (error) => {
      console.error('=== useChat ERROR ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Error cause:', error.cause);
      console.error('===================');
    },
    onResponse: async (response) => {
      console.log('=== useChat RESPONSE ===');
      console.log('Response:', response);
      console.log('Status:', response.status);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));
      console.log('URL:', response.url);
      
      // Try to read the response body
      try {
        const clonedResponse = response.clone();
        const text = await clonedResponse.text();
        console.log('Response body (first 200 chars):', text.substring(0, 200));
      } catch (e) {
        console.log('Could not read response body:', e);
      }
      console.log('===================');
    },
    onFinish: (message) => {
      console.log('=== Message finished ===');
      console.log('Message:', message);
      console.log('===================');
    },
  });
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);
  
  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 1) {
      const chatHistory = messages.slice(1); // Skip welcome message
      localStorage.setItem(`eryk-chat-${sessionId}`, JSON.stringify(chatHistory));
    }
  }, [messages, sessionId]);
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmit(e);
  };
  
  const handleFeedback = async (messageId: string, feedback: 'helpful' | 'not_helpful') => {
    if (feedbackGiven[messageId]) return;
    
    try {
      const response = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, messageId, feedback }),
      });
      
      if (response.ok) {
        setFeedbackGiven(prev => ({ ...prev, [messageId]: feedback }));
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };
  
  const containerClass = embedded ? 'eryk-chat embedded' : 'eryk-chat modal';
  
  const chatContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={containerClass}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <div className="eryk-chat-container">
            {/* Header */}
            <div className="eryk-chat-header">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold">Eryk AI</h3>
              </div>
              {!embedded && onClose && (
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            
            {/* Messages */}
            <div className="eryk-chat-messages">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`message ${message.role}`}
                >
                  <div className="message-content">
                    {message.role === 'assistant' && (
                      <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1">
                      <div className="message-text">
                        {message.content}
                      </div>
                      {message.role === 'assistant' && message.id !== 'welcome' && (
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => handleFeedback(message.id, 'helpful')}
                            className={`p-1 rounded transition-colors ${
                              feedbackGiven[message.id] === 'helpful'
                                ? 'text-green-400'
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                            disabled={!!feedbackGiven[message.id]}
                            aria-label="Helpful"
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleFeedback(message.id, 'not_helpful')}
                            className={`p-1 rounded transition-colors ${
                              feedbackGiven[message.id] === 'not_helpful'
                                ? 'text-red-400'
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                            disabled={!!feedbackGiven[message.id]}
                            aria-label="Not helpful"
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                          {feedbackGiven[message.id] && (
                            <span className="text-xs text-gray-500 ml-2">
                              Thanks for your feedback!
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="message assistant"
                >
                  <div className="message-content">
                    <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-1" />
                    <div className="message-text">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                </motion.div>
              )}
              
              {error && (
                <div className="message error">
                  <div className="message-content">
                    <div className="message-text text-red-400">
                      <div>Sorry, an error occurred. Please try again later.</div>
                      <div className="text-xs mt-2 opacity-70">
                        Error: {error.message || 'Unknown error'}
                      </div>
                      {process.env.NODE_ENV === 'development' && (
                        <div className="text-xs mt-1 font-mono">
                          {error.stack}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input */}
            <form onSubmit={handleFormSubmit} className="eryk-chat-input">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about projects, experience..."
                className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg 
                         text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 
                         transition-colors"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all
                         flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                <span className="sr-only">Send</span>
              </button>
            </form>
            
            {/* Disclaimer */}
            <div className="text-xs text-gray-500 text-center mt-2">
              Powered by AI • Responses based on available data
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
  
  // Use portal for modal to ensure it renders at document root
  if (!embedded && typeof document !== 'undefined') {
    return createPortal(chatContent, document.body);
  }
  
  return chatContent;
}