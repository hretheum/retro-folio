import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, User, Calendar, MapPin, Globe, Heart, Star, Trash2, Edit, Save, X } from 'lucide-react';
import { validateGuestbookEntry, sanitizeInput } from '../utils/validation';

interface GuestbookEntry {
  id: string;
  name: string;
  email?: string;
  website?: string;
  location?: string;
  message: string;
  timestamp: Date;
  mood: string;
  rating: number;
  isEditing?: boolean;
}

const moods = [
  { emoji: '😊', name: 'Happy', color: 'var(--retro-yellow)' },
  { emoji: '🤩', name: 'Excited', color: 'var(--retro-hot-pink)' },
  { emoji: '😎', name: 'Cool', color: 'var(--retro-electric-blue)' },
  { emoji: '🥰', name: 'Love it', color: 'var(--retro-red)' },
  { emoji: '🤔', name: 'Thinking', color: 'var(--retro-purple)' },
  { emoji: '👍', name: 'Thumbs up', color: 'var(--retro-neon-green)' },
  { emoji: '🔥', name: 'Fire', color: 'var(--retro-orange)' },
  { emoji: '⭐', name: 'Amazing', color: 'var(--retro-yellow)' }
];

export default function Guestbook() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    website: '',
    location: '',
    message: '',
    mood: moods[0].emoji,
    rating: 5
  });

  const entriesPerPage = 5;

  // ESC key handler for closing modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFormOpen) {
        setIsFormOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isFormOpen]);

  // Load entries from localStorage on mount
  useEffect(() => {
    const savedEntries = localStorage.getItem('guestbook-entries');
    if (savedEntries) {
      try {
        const parsed = JSON.parse(savedEntries).map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
        setEntries(parsed);
        setTotalEntries(parsed.length);
      } catch (error) {
        console.error('Error loading guestbook entries:', error);
        initializeWithSampleEntries();
      }
    } else {
      initializeWithSampleEntries();
    }
  }, []);

  // Save entries to localStorage whenever entries change
  useEffect(() => {
    if (entries.length > 0) {
      localStorage.setItem('guestbook-entries', JSON.stringify(entries));
      setTotalEntries(entries.length);
    }
  }, [entries]);

  const initializeWithSampleEntries = () => {
    const sampleEntries: GuestbookEntry[] = [
      {
        id: '1',
        name: 'WebMaster2000',
        email: 'webmaster@geocities.com',
        website: 'http://geocities.com/webmaster2000',
        location: 'Cyberspace',
        message: 'Wow! This site is totally rad! 🌟 Love the retro vibes and the Saturn cursor is AMAZING! Keep up the awesome work! 💫',
        timestamp: new Date('2024-12-15T10:30:00'),
        mood: '🤩',
        rating: 5
      },
      {
        id: '2',
        name: 'RetroFan98',
        email: 'retrofan@hotmail.com',
        location: 'Poland',
        message: 'This brings back so many memories! The music player is incredible and actually works! Darude - Sandstorm FTW! 🎵⚡',
        timestamp: new Date('2024-12-15T09:15:00'),
        mood: '😎',
        rating: 5
      },
      {
        id: '3',
        name: 'DesignGuru',
        website: 'http://myawesomesite.tripod.com',
        location: 'Internet',
        message: 'As a fellow web designer, I must say this is pure genius! The attention to detail is incredible. How did you make it so authentic? 🔥',
        timestamp: new Date('2024-12-15T08:45:00'),
        mood: '🔥',
        rating: 5
      }
    ];

    setEntries(sampleEntries);
    setTotalEntries(sampleEntries.length);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const validation = validateGuestbookEntry(formData);
    if (!validation.isValid) {
      alert('Please fix the following errors:\n\n' + validation.errors.join('\n'));
      return;
    }

    // Sanitize all inputs
    const newEntry: GuestbookEntry = {
      id: Date.now().toString(),
      name: sanitizeInput(formData.name.trim()),
      email: formData.email.trim() ? sanitizeInput(formData.email.trim()) : undefined,
      website: formData.website.trim() || undefined, // URL validation already done
      location: formData.location.trim() ? sanitizeInput(formData.location.trim()) : undefined,
      message: sanitizeInput(formData.message.trim()),
      timestamp: new Date(),
      mood: formData.mood,
      rating: formData.rating
    };

    setEntries(prev => [newEntry, ...prev]);
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      website: '',
      location: '',
      message: '',
      mood: moods[0].emoji,
      rating: 5
    });
    
    setIsFormOpen(false);
    setCurrentPage(1); // Go to first page to see new entry
    
    // Show success message
    alert('🎉 Your entry has been added to the guestbook! Thanks for visiting! 🎉');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      setEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  const handleEdit = (id: string) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, isEditing: true } : entry
    ));
  };

  const handleSaveEdit = (id: string, updatedMessage: string) => {
    // Validate and sanitize the updated message
    if (!updatedMessage.trim() || updatedMessage.trim().length < 5 || updatedMessage.trim().length > 1000) {
      alert('Message must be between 5 and 1000 characters');
      return;
    }
    
    setEntries(prev => prev.map(entry => 
      entry.id === id 
        ? { ...entry, message: sanitizeInput(updatedMessage.trim()), isEditing: false }
        : entry
    ));
  };

  const handleCancelEdit = (id: string) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, isEditing: false } : entry
    ));
  };

  const paginatedEntries = entries.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const totalPages = Math.ceil(entries.length / entriesPerPage);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <section className="retro-guestbook">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="retro-guestbook-header"
      >
        <h2 className="retro-guestbook-title">
          📖 GUESTBOOK 📖
        </h2>
        <p className="retro-guestbook-subtitle">
          <span className="retro-blink">✨ SIGN MY GUESTBOOK! ✨</span>
        </p>
        <div className="retro-guestbook-stats">
          <div className="retro-stat">
            <span className="retro-stat-icon">👥</span>
            <span className="retro-stat-value">{totalEntries}</span>
            <span className="retro-stat-label">Visitors</span>
          </div>
          <div className="retro-stat">
            <span className="retro-stat-icon">📝</span>
            <span className="retro-stat-value">{entries.filter(e => e.message.length > 100).length}</span>
            <span className="retro-stat-label">Long Messages</span>
          </div>
          <div className="retro-stat">
            <span className="retro-stat-icon">⭐</span>
            <span className="retro-stat-value">{entries.length > 0 ? (entries.reduce((sum, e) => sum + e.rating, 0) / entries.length).toFixed(1) : '5.0'}</span>
            <span className="retro-stat-label">Avg Rating</span>
          </div>
        </div>
      </motion.div>

      {/* Sign Guestbook Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="retro-guestbook-cta"
      >
        <motion.button
          onClick={() => setIsFormOpen(true)}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="retro-guestbook-sign-button"
        >
          <MessageSquare className="retro-button-icon" />
          SIGN MY GUESTBOOK!
        </motion.button>
      </motion.div>

      {/* Guestbook Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="retro-guestbook-modal"
            onClick={() => setIsFormOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="retro-guestbook-form-container"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="retro-form-header">
                <h3>📝 Sign the Guestbook! 📝</h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="retro-close-button"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="retro-guestbook-form">
                <div className="retro-form-row">
                  <div className="retro-form-field">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your awesome name"
                      required
                    />
                  </div>
                  <div className="retro-form-field">
                    <label>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="retro-form-row">
                  <div className="retro-form-field">
                    <label>Website</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="http://your-cool-site.com"
                    />
                  </div>
                  <div className="retro-form-field">
                    <label>Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Your city/country"
                    />
                  </div>
                </div>

                <div className="retro-form-field">
                  <label>Message *</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Leave your awesome message here! Tell me what you think about the site! 🌟"
                    rows={4}
                    required
                  />
                </div>

                <div className="retro-form-row">
                  <div className="retro-form-field">
                    <label>Mood</label>
                    <div className="retro-mood-selector">
                      {moods.map((mood) => (
                        <button
                          key={mood.emoji}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, mood: mood.emoji }))}
                          className={`retro-mood-button ${formData.mood === mood.emoji ? 'active' : ''}`}
                          title={mood.name}
                        >
                          {mood.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="retro-form-field">
                    <label>Rating</label>
                    <div className="retro-rating-selector">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                          className={`retro-star-button ${star <= formData.rating ? 'active' : ''}`}
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="retro-form-actions">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="retro-button retro-button-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="retro-button retro-button-primary"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Sign Guestbook!
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guestbook Entries */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="retro-guestbook-entries"
      >
        <h3 className="retro-entries-title">
          💬 Recent Entries ({totalEntries} total)
        </h3>

        <div className="retro-entries-list">
          {paginatedEntries.map((entry, index) => (
            <GuestbookEntry
              key={entry.id}
              entry={entry}
              index={index}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="retro-pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="retro-page-button"
            >
              ← Previous
            </button>
            
            <div className="retro-page-info">
              Page {currentPage} of {totalPages}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="retro-page-button"
            >
              Next →
            </button>
          </div>
        )}
      </motion.div>

      <style jsx>{`
        .retro-guestbook {
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .retro-guestbook-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .retro-guestbook-title {
          font-size: 2.5rem;
          font-weight: bold;
          color: var(--retro-hot-pink);
          text-shadow: 
            2px 2px 0 var(--retro-black),
            4px 4px 8px rgba(255, 20, 147, 0.5);
          margin-bottom: 1rem;
          animation: retro-rainbow-text 3s infinite;
        }

        .retro-guestbook-subtitle {
          font-size: 1.2rem;
          color: var(--retro-neon-green);
          margin-bottom: 1.5rem;
        }

        .retro-guestbook-stats {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-bottom: 1rem;
        }

        .retro-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: var(--retro-black);
          border: 3px outset var(--retro-gray);
          padding: 1rem;
          min-width: 80px;
        }

        .retro-stat-icon {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .retro-stat-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--retro-yellow);
          font-family: 'Courier New', monospace;
        }

        .retro-stat-label {
          font-size: 0.8rem;
          color: var(--retro-cyan);
          text-transform: uppercase;
        }

        .retro-guestbook-cta {
          text-align: center;
          margin-bottom: 2rem;
        }

        .retro-guestbook-sign-button {
          background: linear-gradient(45deg, 
            var(--retro-hot-pink) 0%, 
            var(--retro-purple) 100%);
          border: 4px outset var(--retro-gray);
          color: var(--retro-white);
          font-family: 'Comic Neue', 'Comic Sans MS', cursive;
          font-weight: bold;
          font-size: 1.2rem;
          padding: 1rem 2rem;
          cursor: pointer;
          text-shadow: 2px 2px 0 var(--retro-black);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 auto;
          animation: retro-pulse 2s infinite;
          box-shadow: 
            inset 2px 2px 4px rgba(255, 255, 255, 0.3),
            inset -2px -2px 4px rgba(0, 0, 0, 0.3),
            0 0 20px rgba(255, 20, 147, 0.5);
        }

        .retro-guestbook-sign-button:hover {
          background: linear-gradient(45deg, 
            var(--retro-electric-blue) 0%, 
            var(--retro-cyan) 100%);
          transform: translateY(-2px);
          box-shadow: 
            inset 2px 2px 4px rgba(255, 255, 255, 0.3),
            inset -2px -2px 4px rgba(0, 0, 0, 0.3),
            0 6px 20px rgba(0, 128, 255, 0.5);
        }

        .retro-guestbook-sign-button:active {
          border: 4px inset var(--retro-gray);
          transform: translateY(0);
        }

        .retro-button-icon {
          width: 1.2rem;
          height: 1.2rem;
        }

        .retro-guestbook-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(5px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .retro-guestbook-form-container {
          background: var(--retro-black);
          border: 4px outset var(--retro-gray);
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 
            inset 2px 2px 4px rgba(255, 255, 255, 0.2),
            inset -2px -2px 4px rgba(0, 0, 0, 0.5),
            0 0 30px rgba(0, 255, 255, 0.3);
        }

        .retro-form-header {
          background: linear-gradient(90deg, 
            var(--retro-electric-blue) 0%, 
            var(--retro-cyan) 100%);
          color: var(--retro-white);
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px inset var(--retro-gray);
        }

        .retro-form-header h3 {
          margin: 0;
          font-size: 1.3rem;
          font-weight: bold;
          text-shadow: 1px 1px 0 var(--retro-black);
        }

        .retro-close-button {
          background: var(--retro-red);
          border: 2px outset var(--retro-gray);
          color: var(--retro-white);
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .retro-close-button:hover {
          background: var(--retro-hot-pink);
          transform: scale(1.1);
        }

        .retro-guestbook-form {
          padding: 1.5rem;
        }

        .retro-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .retro-form-field {
          margin-bottom: 1rem;
        }

        .retro-form-field label {
          display: block;
          color: var(--retro-cyan);
          font-weight: bold;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          text-transform: uppercase;
        }

        .retro-form-field input,
        .retro-form-field textarea {
          width: 100%;
          background: var(--retro-black);
          border: 2px inset var(--retro-gray);
          color: var(--retro-white);
          padding: 0.5rem;
          font-family: 'Comic Neue', 'Comic Sans MS', cursive;
          font-size: 0.9rem;
        }

        .retro-form-field input:focus,
        .retro-form-field textarea:focus {
          outline: none;
          border: 2px solid var(--retro-neon-green);
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
        }

        .retro-mood-selector {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .retro-mood-button {
          background: var(--retro-black);
          border: 2px outset var(--retro-gray);
          font-size: 1.5rem;
          width: 40px;
          height: 40px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .retro-mood-button:hover {
          transform: scale(1.1);
          border: 2px solid var(--retro-yellow);
        }

        .retro-mood-button.active {
          border: 2px inset var(--retro-gray);
          background: var(--retro-yellow);
          transform: scale(1.1);
        }

        .retro-rating-selector {
          display: flex;
          gap: 0.25rem;
        }

        .retro-star-button {
          background: var(--retro-black);
          border: 2px outset var(--retro-gray);
          color: var(--retro-gray);
          width: 35px;
          height: 35px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .retro-star-button:hover {
          color: var(--retro-yellow);
          border: 2px solid var(--retro-yellow);
        }

        .retro-star-button.active {
          color: var(--retro-yellow);
          background: var(--retro-black);
          border: 2px inset var(--retro-gray);
        }

        .retro-form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 2px inset var(--retro-gray);
        }

        .retro-button {
          background: linear-gradient(45deg, 
            var(--retro-electric-blue) 0%, 
            var(--retro-cyan) 100%);
          border: 3px outset var(--retro-gray);
          color: var(--retro-white);
          font-family: 'Comic Neue', 'Comic Sans MS', cursive;
          font-weight: bold;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          text-shadow: 1px 1px 0 var(--retro-black);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .retro-button:hover {
          background: linear-gradient(45deg, 
            var(--retro-hot-pink) 0%, 
            var(--retro-purple) 100%);
          transform: translateY(-1px);
        }

        .retro-button:active {
          border: 3px inset var(--retro-gray);
          transform: translateY(0);
        }

        .retro-button-secondary {
          background: linear-gradient(45deg, 
            var(--retro-dark-gray) 0%, 
            var(--retro-gray) 100%);
          color: var(--retro-black);
        }

        .retro-button-primary {
          background: linear-gradient(45deg, 
            var(--retro-neon-green) 0%, 
            var(--retro-cyan) 100%);
        }

        .retro-guestbook-entries {
          margin-top: 2rem;
        }

        .retro-entries-title {
          font-size: 1.5rem;
          color: var(--retro-electric-blue);
          text-align: center;
          margin-bottom: 1.5rem;
          text-shadow: 2px 2px 0 var(--retro-black);
        }

        .retro-entries-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .retro-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
          padding: 1rem;
          background: var(--retro-black);
          border: 3px outset var(--retro-gray);
        }

        .retro-page-button {
          background: linear-gradient(45deg, 
            var(--retro-electric-blue) 0%, 
            var(--retro-cyan) 100%);
          border: 3px outset var(--retro-gray);
          color: var(--retro-white);
          font-family: 'Comic Neue', 'Comic Sans MS', cursive;
          font-weight: bold;
          padding: 0.5rem 1rem;
          cursor: pointer;
          text-shadow: 1px 1px 0 var(--retro-black);
        }

        .retro-page-button:disabled {
          background: var(--retro-dark-gray);
          color: var(--retro-gray);
          cursor: not-allowed;
          opacity: 0.5;
        }

        .retro-page-button:not(:disabled):hover {
          background: linear-gradient(45deg, 
            var(--retro-hot-pink) 0%, 
            var(--retro-purple) 100%);
          transform: translateY(-1px);
        }

        .retro-page-info {
          color: var(--retro-yellow);
          font-weight: bold;
          font-family: 'Courier New', monospace;
        }

        @media (max-width: 768px) {
          .retro-guestbook {
            padding: 1rem;
          }
          
          .retro-guestbook-title {
            font-size: 2rem;
          }
          
          .retro-guestbook-stats {
            flex-direction: column;
            gap: 1rem;
          }
          
          .retro-form-row {
            grid-template-columns: 1fr;
          }
          
          .retro-form-actions {
            flex-direction: column;
          }
          
          .retro-pagination {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </section>
  );
}

interface GuestbookEntryProps {
  entry: GuestbookEntry;
  index: number;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onSaveEdit: (id: string, message: string) => void;
  onCancelEdit: (id: string) => void;
}

function GuestbookEntry({ entry, index, onDelete, onEdit, onSaveEdit, onCancelEdit }: GuestbookEntryProps) {
  const [editMessage, setEditMessage] = useState(entry.message);

  const handleSave = () => {
    if (editMessage.trim()) {
      onSaveEdit(entry.id, editMessage.trim());
    }
  };

  const handleCancel = () => {
    setEditMessage(entry.message);
    onCancelEdit(entry.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      className="retro-guestbook-entry"
    >
      <div className="retro-entry-header">
        <div className="retro-entry-user">
          <div className="retro-entry-avatar">
            <User className="w-6 h-6" />
          </div>
          <div className="retro-entry-info">
            <div className="retro-entry-name">
              {entry.website ? (
                <a href={entry.website} target="_blank" rel="noopener noreferrer" className="retro-entry-link">
                  {entry.name}
                </a>
              ) : (
                entry.name
              )}
              <span className="retro-entry-mood">{entry.mood}</span>
            </div>
            <div className="retro-entry-meta">
              {entry.email && (
                <span className="retro-entry-email">
                  📧 {entry.email}
                </span>
              )}
              {entry.location && (
                <span className="retro-entry-location">
                  <MapPin className="w-3 h-3" />
                  {entry.location}
                </span>
              )}
              <span className="retro-entry-date">
                <Calendar className="w-3 h-3" />
                {entry.timestamp.toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="retro-entry-actions">
          <div className="retro-entry-rating">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < entry.rating ? 'retro-star-filled' : 'retro-star-empty'}`}
              />
            ))}
          </div>
          <div className="retro-entry-buttons">
            <button
              onClick={() => onEdit(entry.id)}
              className="retro-entry-button retro-edit-button"
              title="Edit message"
            >
              <Edit className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              className="retro-entry-button retro-delete-button"
              title="Delete entry"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="retro-entry-content">
        {entry.isEditing ? (
          <div className="retro-entry-edit">
            <textarea
              value={editMessage}
              onChange={(e) => setEditMessage(e.target.value)}
              className="retro-edit-textarea"
              rows={3}
            />
            <div className="retro-edit-actions">
              <button onClick={handleSave} className="retro-entry-button retro-save-button">
                <Save className="w-3 h-3" />
                Save
              </button>
              <button onClick={handleCancel} className="retro-entry-button retro-cancel-button">
                <X className="w-3 h-3" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="retro-entry-message">
            {entry.message}
          </div>
        )}
      </div>

      <style jsx>{`
        .retro-guestbook-entry {
          background: var(--retro-black);
          border: 3px outset var(--retro-gray);
          padding: 1.5rem;
          box-shadow: 
            inset 1px 1px 2px rgba(255, 255, 255, 0.2),
            inset -1px -1px 2px rgba(0, 0, 0, 0.5);
        }

        .retro-entry-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .retro-entry-user {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          flex: 1;
        }

        .retro-entry-avatar {
          background: linear-gradient(45deg, 
            var(--retro-electric-blue) 0%, 
            var(--retro-cyan) 100%);
          border: 2px outset var(--retro-gray);
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--retro-white);
          flex-shrink: 0;
        }

        .retro-entry-info {
          flex: 1;
        }

        .retro-entry-name {
          font-size: 1.1rem;
          font-weight: bold;
          color: var(--retro-neon-green);
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .retro-entry-link {
          color: var(--retro-hot-pink);
          text-decoration: underline;
        }

        .retro-entry-link:hover {
          color: var(--retro-yellow);
          animation: retro-blink 0.5s infinite;
        }

        .retro-entry-mood {
          font-size: 1.2rem;
          animation: retro-bounce 2s infinite;
        }

        .retro-entry-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          font-size: 0.8rem;
          color: var(--retro-cyan);
        }

        .retro-entry-email,
        .retro-entry-location,
        .retro-entry-date {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .retro-entry-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5rem;
        }

        .retro-entry-rating {
          display: flex;
          gap: 0.25rem;
        }

        .retro-star-filled {
          color: var(--retro-yellow);
        }

        .retro-star-empty {
          color: var(--retro-dark-gray);
        }

        .retro-entry-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .retro-entry-button {
          background: var(--retro-black);
          border: 2px outset var(--retro-gray);
          color: var(--retro-white);
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.8rem;
          gap: 0.25rem;
        }

        .retro-entry-button:hover {
          transform: scale(1.1);
        }

        .retro-entry-button:active {
          border: 2px inset var(--retro-gray);
        }

        .retro-edit-button {
          background: var(--retro-electric-blue);
        }

        .retro-delete-button {
          background: var(--retro-red);
        }

        .retro-save-button {
          background: var(--retro-neon-green);
          color: var(--retro-black);
          width: auto;
          padding: 0.25rem 0.5rem;
        }

        .retro-cancel-button {
          background: var(--retro-orange);
          width: auto;
          padding: 0.25rem 0.5rem;
        }

        .retro-entry-content {
          border-top: 2px inset var(--retro-gray);
          padding-top: 1rem;
        }

        .retro-entry-message {
          color: var(--retro-white);
          line-height: 1.6;
          font-size: 0.95rem;
        }

        .retro-entry-edit {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .retro-edit-textarea {
          width: 100%;
          background: var(--retro-black);
          border: 2px inset var(--retro-gray);
          color: var(--retro-white);
          padding: 0.5rem;
          font-family: 'Comic Neue', 'Comic Sans MS', cursive;
          font-size: 0.9rem;
          resize: vertical;
        }

        .retro-edit-textarea:focus {
          outline: none;
          border: 2px solid var(--retro-neon-green);
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
        }

        .retro-edit-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        @media (max-width: 768px) {
          .retro-entry-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .retro-entry-actions {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
          
          .retro-entry-meta {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </motion.div>
  );
}